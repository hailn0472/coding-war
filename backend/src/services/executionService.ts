import { logger } from '../utils/logger';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { randomBytes } from 'crypto';
import { tmpdir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

/**
 * Execution Service
 * Handles test case execution in sandbox containers
 * Validates: REQ-6.4, REQ-6.5, REQ-6.6, REQ-6.7, REQ-6.8
 */

export interface ExecutionConfig {
  language: 'C' | 'CPP' | 'PYTHON' | 'JAVA';
  sourceCode?: string;  // For Python
  binary?: Buffer;      // For compiled languages
  input: string;
  expectedOutput: string;
  timeLimit: number;    // milliseconds
  memoryLimit: number;  // MB
}

export interface ExecutionResult {
  verdict: 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'RUNTIME_ERROR';
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;  // milliseconds
  memoryUsed: number;     // MB
}

/**
 * Language-specific execution configurations
 */
const LANGUAGE_CONFIG = {
  C: {
    executeCmd: '/workspace/solution',
    binaryFile: '/workspace/solution',
  },
  CPP: {
    executeCmd: '/workspace/solution',
    binaryFile: '/workspace/solution',
  },
  PYTHON: {
    executeCmd: 'python3 /workspace/solution.py',
    sourceFile: '/workspace/solution.py',
  },
  JAVA: {
    executeCmd: 'java -cp /workspace Solution',
    binaryFile: '/workspace/Solution.class',
  },
};

/**
 * Execute test case in sandbox container
 */
export async function executeTestCase(config: ExecutionConfig): Promise<ExecutionResult> {
  const { language, sourceCode, binary, input, expectedOutput, timeLimit, memoryLimit } = config;
  const containerName = `exec-${randomBytes(8).toString('hex')}`;

  logger.debug('Starting test case execution', {
    language,
    inputLength: input.length,
    timeLimit,
    memoryLimit,
  });

  const startTime = Date.now();

  try {
    // Create execution container
    await createExecutionContainer(containerName, memoryLimit);

    // Start container first
    await execAsync(`docker start ${containerName}`);

    // Write source code or binary to container
    if (language === 'PYTHON' && sourceCode) {
      await writeSourceToContainer(containerName, 'solution.py', sourceCode);
    } else if (binary) {
      const langConfig = LANGUAGE_CONFIG[language];
      if ('binaryFile' in langConfig) {
        await writeBinaryToContainer(containerName, langConfig.binaryFile, binary);
      } else {
        throw new Error(`Language ${language} does not support binary execution`);
      }
    } else {
      throw new Error('Either sourceCode (for Python) or binary (for compiled languages) must be provided');
    }

    // Write input to container
    await writeInputToContainer(containerName, input);

    // Execute program with timeout
    const execResult = await executeProgram(
      containerName,
      language,
      timeLimit
    );

    const executionTime = Date.now() - startTime;

    // Get memory usage
    const memoryUsed = await getMemoryUsage(containerName);

    // Determine verdict
    const verdict = determineVerdict(
      execResult,
      expectedOutput,
      executionTime,
      timeLimit,
      memoryUsed,
      memoryLimit
    );

    logger.debug('Test case execution completed', {
      language,
      verdict,
      executionTime,
      memoryUsed,
    });

    return {
      verdict,
      stdout: execResult.stdout,
      stderr: execResult.stderr,
      exitCode: execResult.exitCode,
      executionTime,
      memoryUsed,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown execution error';

    logger.error('Execution error', {
      language,
      error: errorMessage,
      executionTime,
    });

    return {
      verdict: 'RUNTIME_ERROR',
      stdout: '',
      stderr: errorMessage,
      exitCode: 1,
      executionTime,
      memoryUsed: 0,
    };
  } finally {
    // Clean up container
    await destroyExecutionContainer(containerName).catch((err) => {
      logger.warn('Failed to destroy execution container', {
        containerName,
        error: err.message,
      });
    });
  }
}

/**
 * Create Docker container for execution
 */
async function createExecutionContainer(containerName: string, memoryLimit: number): Promise<void> {
  try {
    const createCmd = [
      'docker create',
      `--name ${containerName}`,
      `--memory=${memoryLimit}m`,
      `--memory-swap=${memoryLimit}m`,
      '--cpus=1',
      '--network=none',
      '--tmpfs /tmp:rw,noexec,nosuid,size=10m',
      '--security-opt=no-new-privileges',
      '--cap-drop=ALL',
      '--pids-limit=50',
      'coding-war-judge:latest',
      'sleep 30',
    ].join(' ');

    await execAsync(createCmd);

    logger.debug('Execution container created', {
      containerName,
      memoryLimit,
    });
  } catch (error) {
    logger.error('Failed to create execution container', {
      containerName,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Failed to create execution container');
  }
}

/**
 * Write source code to container
 */
async function writeSourceToContainer(
  containerName: string,
  fileName: string,
  sourceCode: string
): Promise<void> {
  try {
    // Create temporary file with source code
    const tempFile = join(tmpdir(), `${containerName}-${fileName}`);
    await writeFile(tempFile, sourceCode);

    // Copy to container
    await execAsync(`docker cp "${tempFile}" ${containerName}:/workspace/${fileName}`);

    // Clean up temp file
    await unlink(tempFile);

    logger.debug('Source code written to execution container', {
      containerName,
      fileName,
    });
  } catch (error) {
    logger.error('Failed to write source code to execution container', {
      containerName,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Failed to write source code to execution container');
  }
}

/**
 * Write binary to container
 */
async function writeBinaryToContainer(
  containerName: string,
  binaryPath: string,
  binary: Buffer
): Promise<void> {
  try {
    // Create temporary file with binary
    const tempFile = join(tmpdir(), `${containerName}-binary`);
    await writeFile(tempFile, binary, { mode: 0o755 });

    // Copy to container
    await execAsync(`docker cp "${tempFile}" ${containerName}:${binaryPath}`);
    
    // Make executable as root (container must be running)
    await execAsync(`docker exec --user root ${containerName} chmod +x ${binaryPath}`);

    // Clean up temp file
    await unlink(tempFile);

    logger.debug('Binary written to execution container', {
      containerName,
      binaryPath,
      size: binary.length,
    });
  } catch (error: any) {
    logger.error('Failed to write binary to execution container', {
      containerName,
      error: error instanceof Error ? error.message : 'Unknown error',
      stderr: error.stderr,
      stdout: error.stdout,
    });
    throw new Error('Failed to write binary to execution container');
  }
}

/**
 * Write input to container
 */
async function writeInputToContainer(containerName: string, input: string): Promise<void> {
  try {
    // Create temporary file with input
    const tempFile = join(tmpdir(), `${containerName}-input.txt`);
    await writeFile(tempFile, input);

    // Copy to container
    await execAsync(`docker cp "${tempFile}" ${containerName}:/workspace/input.txt`);

    // Clean up temp file
    await unlink(tempFile);

    logger.debug('Input written to execution container', {
      containerName,
      inputLength: input.length,
    });
  } catch (error) {
    logger.error('Failed to write input to execution container', {
      containerName,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Failed to write input to execution container');
  }
}

/**
 * Execute program in container
 */
async function executeProgram(
  containerName: string,
  language: string,
  timeLimit: number
): Promise<{ stdout: string; stderr: string; exitCode: number; timeout: boolean }> {
  const langConfig = LANGUAGE_CONFIG[language as keyof typeof LANGUAGE_CONFIG];
  const executeCmd = `${langConfig.executeCmd} < /workspace/input.txt`;

  try {
    const execCmd = `docker exec ${containerName} sh -c "${executeCmd} 2>&1"`;
    const { stdout, stderr } = await execAsync(execCmd, {
      timeout: timeLimit,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    logger.debug('Program executed successfully', {
      containerName,
      outputLength: stdout.length,
    });

    return {
      stdout: stdout || '',
      stderr: stderr || '',
      exitCode: 0,
      timeout: false,
    };
  } catch (error: any) {
    // Check if timeout occurred
    if (error.killed || error.signal === 'SIGTERM') {
      logger.debug('Program execution timeout', {
        containerName,
        timeLimit,
      });

      return {
        stdout: error.stdout || '',
        stderr: error.stderr || 'Time limit exceeded',
        exitCode: 124, // Timeout exit code
        timeout: true,
      };
    }

    // Runtime error
    logger.debug('Program execution failed', {
      containerName,
      exitCode: error.code,
      error: error.message,
    });

    return {
      stdout: error.stdout || '',
      stderr: error.stderr || error.message,
      exitCode: error.code || 1,
      timeout: false,
    };
  }
}

/**
 * Get memory usage from container
 */
async function getMemoryUsage(containerName: string): Promise<number> {
  try {
    const statsCmd = `docker stats ${containerName} --no-stream --format "{{.MemUsage}}"`;
    const { stdout } = await execAsync(statsCmd);
    return parseMemoryUsage(stdout);
  } catch (error) {
    logger.warn('Failed to get memory usage', {
      containerName,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return 0;
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
 * Determine verdict based on execution result
 */
function determineVerdict(
  execResult: { stdout: string; stderr: string; exitCode: number; timeout: boolean },
  expectedOutput: string,
  executionTime: number,
  timeLimit: number,
  memoryUsed: number,
  memoryLimit: number
): 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' {
  // Check time limit
  if (execResult.timeout || executionTime > timeLimit) {
    return 'TIME_LIMIT_EXCEEDED';
  }

  // Check memory limit
  if (memoryUsed > memoryLimit) {
    return 'MEMORY_LIMIT_EXCEEDED';
  }

  // Check runtime error
  if (execResult.exitCode !== 0) {
    return 'RUNTIME_ERROR';
  }

  // Compare output (exact match, ignore trailing whitespace)
  const actualOutput = normalizeOutput(execResult.stdout);
  const expected = normalizeOutput(expectedOutput);

  if (actualOutput === expected) {
    return 'ACCEPTED';
  }

  return 'WRONG_ANSWER';
}

/**
 * Normalize output for comparison
 * Removes trailing whitespace from each line and trailing newlines
 */
function normalizeOutput(output: string): string {
  return output
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trimEnd();
}

/**
 * Destroy execution container
 */
async function destroyExecutionContainer(containerName: string): Promise<void> {
  try {
    await execAsync(`docker stop ${containerName}`, { timeout: 5000 });
    await execAsync(`docker rm ${containerName}`);

    logger.debug('Execution container destroyed', {
      containerName,
    });
  } catch (error) {
    logger.error('Failed to destroy execution container', {
      containerName,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
