import { exec } from 'child_process';
import { promisify } from 'util';
import { randomBytes } from 'crypto';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

/**
 * Docker Sandbox Service
 * Manages Docker containers for secure code execution
 * Implements resource limits and security restrictions
 * Validates: REQ-7.1, REQ-7.2, REQ-7.3, REQ-7.4, REQ-7.5, REQ-7.6, REQ-7.7
 */

export interface SandboxConfig {
  language: 'C' | 'CPP' | 'PYTHON' | 'JAVA';
  timeLimit: number;      // milliseconds
  memoryLimit: number;    // MB
  sourceCode: string;
  input?: string;
}

export interface SandboxResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;  // milliseconds
  memoryUsed: number;     // MB
  timeout: boolean;
  memoryExceeded: boolean;
  compilationError?: string;
}

const SANDBOX_IMAGE = 'coding-war-judge:latest';

/**
 * Language-specific compiler and execution commands
 */
const LANGUAGE_CONFIG = {
  C: {
    compileCmd: 'gcc -O2 -std=c11 -o /workspace/solution /workspace/solution.c',
    executeCmd: '/workspace/solution',
    sourceFile: 'solution.c',
  },
  CPP: {
    compileCmd: 'g++ -O2 -std=c++17 -o /workspace/solution /workspace/solution.cpp',
    executeCmd: '/workspace/solution',
    sourceFile: 'solution.cpp',
  },
  PYTHON: {
    compileCmd: null, // Python is interpreted
    executeCmd: 'python3 /workspace/solution.py',
    sourceFile: 'solution.py',
  },
  JAVA: {
    compileCmd: 'javac -d /workspace /workspace/Solution.java',
    executeCmd: 'java -cp /workspace Solution',
    sourceFile: 'Solution.java',
  },
};

/**
 * Generate unique container name
 */
function generateContainerName(): string {
  return `judge-${randomBytes(8).toString('hex')}`;
}

/**
 * Create Docker container for code execution
 */
export async function createSandbox(config: SandboxConfig): Promise<string> {
  const containerName = generateContainerName();
  const { language, memoryLimit } = config;

  try {
    // Create container with resource limits and security restrictions
    const createCmd = [
      'docker create',
      `--name ${containerName}`,
      `--memory=${memoryLimit}m`,
      `--memory-swap=${memoryLimit}m`, // No swap
      '--cpus=1',
      '--network=none', // No network access
      '--read-only', // Read-only filesystem
      '--tmpfs /workspace:rw,noexec,nosuid,size=100m', // Writable workspace
      '--security-opt=no-new-privileges',
      '--cap-drop=ALL', // Drop all capabilities
      '--pids-limit=50', // Limit number of processes
      SANDBOX_IMAGE,
      'sleep 1', // Placeholder command
    ].join(' ');

    await execAsync(createCmd);

    logger.debug('Sandbox container created', {
      containerName,
      language,
      memoryLimit,
    });

    return containerName;
  } catch (error) {
    logger.error('Failed to create sandbox container', {
      containerName,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Failed to create sandbox container');
  }
}

/**
 * Write file to container
 */
export async function writeFileToContainer(
  containerName: string,
  filePath: string,
  content: string
): Promise<void> {
  try {
    // Use docker cp with stdin
    const cmd = `echo ${JSON.stringify(content)} | docker cp - ${containerName}:${filePath}`;
    await execAsync(cmd);

    logger.debug('File written to container', {
      containerName,
      filePath,
      size: content.length,
    });
  } catch (error) {
    logger.error('Failed to write file to container', {
      containerName,
      filePath,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Failed to write file to container');
  }
}

/**
 * Compile source code in container
 */
export async function compileInContainer(
  containerName: string,
  language: 'C' | 'CPP' | 'PYTHON' | 'JAVA',
  sourceCode: string
): Promise<{ success: boolean; error?: string }> {
  const langConfig = LANGUAGE_CONFIG[language];

  // Write source code to container
  const sourceFile = `/workspace/${langConfig.sourceFile}`;
  try {
    // Create a temporary file with source code
    const tempFile = `/tmp/${containerName}-source`;
    const fs = await import('fs/promises');
    await fs.writeFile(tempFile, sourceCode);
    
    // Copy to container
    await execAsync(`docker cp ${tempFile} ${containerName}:${sourceFile}`);
    
    // Clean up temp file
    await fs.unlink(tempFile);
  } catch (error) {
    logger.error('Failed to copy source code to container', {
      containerName,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { success: false, error: 'Failed to copy source code' };
  }

  // Python doesn't need compilation
  if (!langConfig.compileCmd) {
    return { success: true };
  }

  try {
    // Start container
    await execAsync(`docker start ${containerName}`);

    // Execute compilation command
    const compileCmd = `docker exec ${containerName} sh -c "${langConfig.compileCmd} 2>&1"`;
    await execAsync(compileCmd, {
      timeout: 30000, // 30 seconds for compilation
    });

    logger.debug('Compilation completed', {
      containerName,
      language,
    });

    return { success: true };
  } catch (error: any) {
    const errorOutput = error.stdout || error.stderr || error.message;
    logger.warn('Compilation failed', {
      containerName,
      language,
      error: errorOutput,
    });

    return {
      success: false,
      error: errorOutput,
    };
  }
}

/**
 * Execute code in container
 */
export async function executeInContainer(
  containerName: string,
  config: SandboxConfig
): Promise<SandboxResult> {
  const { language, timeLimit, memoryLimit, input } = config;
  const langConfig = LANGUAGE_CONFIG[language];

  const startTime = Date.now();
  let timeout = false;
  let memoryExceeded = false;

  try {
    // Prepare input if provided
    let executeCmd = langConfig.executeCmd;
    if (input) {
      // Write input to file
      const tempInputFile = `/tmp/${containerName}-input`;
      const fs = await import('fs/promises');
      await fs.writeFile(tempInputFile, input);
      await execAsync(`docker cp ${tempInputFile} ${containerName}:/workspace/input.txt`);
      await fs.unlink(tempInputFile);
      
      executeCmd = `${executeCmd} < /workspace/input.txt`;
    }

    // Execute with timeout
    const execCmd = `docker exec ${containerName} sh -c "${executeCmd} 2>&1"`;
    const { stdout, stderr } = await execAsync(execCmd, {
      timeout: timeLimit,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    const executionTime = Date.now() - startTime;

    // Get memory usage
    const statsCmd = `docker stats ${containerName} --no-stream --format "{{.MemUsage}}"`;
    const { stdout: memStats } = await execAsync(statsCmd);
    const memoryUsed = parseMemoryUsage(memStats);

    logger.debug('Execution completed', {
      containerName,
      executionTime,
      memoryUsed,
    });

    return {
      success: true,
      stdout: stdout || '',
      stderr: stderr || '',
      exitCode: 0,
      executionTime,
      memoryUsed,
      timeout: false,
      memoryExceeded: memoryUsed > memoryLimit,
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;

    // Check if timeout occurred
    if (error.killed || executionTime >= timeLimit) {
      timeout = true;
      logger.warn('Execution timeout', {
        containerName,
        timeLimit,
        executionTime,
      });
    }

    // Get memory usage even on error
    let memoryUsed = 0;
    try {
      const statsCmd = `docker stats ${containerName} --no-stream --format "{{.MemUsage}}"`;
      const { stdout: memStats } = await execAsync(statsCmd);
      memoryUsed = parseMemoryUsage(memStats);
      memoryExceeded = memoryUsed > memoryLimit;
    } catch {
      // Ignore stats error
    }

    logger.warn('Execution failed', {
      containerName,
      executionTime,
      timeout,
      memoryExceeded,
      error: error.message,
    });

    return {
      success: false,
      stdout: error.stdout || '',
      stderr: error.stderr || error.message,
      exitCode: error.code || 1,
      executionTime,
      memoryUsed,
      timeout,
      memoryExceeded,
    };
  }
}

/**
 * Parse memory usage from docker stats output
 */
function parseMemoryUsage(memStats: string): number {
  // Format: "123.4MiB / 512MiB"
  const match = memStats.match(/([0-9.]+)([KMG]iB)/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'KiB':
      return value / 1024;
    case 'MiB':
      return value;
    case 'GiB':
      return value * 1024;
    default:
      return 0;
  }
}

/**
 * Destroy container and clean up resources
 */
export async function destroySandbox(containerName: string): Promise<void> {
  try {
    // Stop container
    await execAsync(`docker stop ${containerName}`, { timeout: 5000 });
    
    // Remove container
    await execAsync(`docker rm ${containerName}`);

    logger.debug('Sandbox container destroyed', {
      containerName,
    });
  } catch (error) {
    logger.error('Failed to destroy sandbox container', {
      containerName,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Don't throw - cleanup is best effort
  }
}

/**
 * Build sandbox Docker image
 */
export async function buildSandboxImage(): Promise<void> {
  logger.info('Building sandbox Docker image...');
  
  try {
    const buildCmd = `docker build -t ${SANDBOX_IMAGE} -f Dockerfile.judge .`;
    await execAsync(buildCmd, {
      cwd: process.cwd(),
      timeout: 300000, // 5 minutes
    });

    logger.info('Sandbox Docker image built successfully');
  } catch (error) {
    logger.error('Failed to build sandbox Docker image', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Failed to build sandbox Docker image');
  }
}

/**
 * Check if sandbox image exists
 */
export async function checkSandboxImage(): Promise<boolean> {
  try {
    await execAsync(`docker image inspect ${SANDBOX_IMAGE}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clean up stale containers
 */
export async function cleanupStaleContainers(): Promise<void> {
  try {
    // Remove all stopped judge containers
    await execAsync('docker container prune -f --filter "label=type=judge"');
    
    logger.info('Cleaned up stale containers');
  } catch (error) {
    logger.error('Failed to cleanup stale containers', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
