import { logger } from '../utils/logger';
import { destroySandbox } from './dockerSandbox';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { randomBytes } from 'crypto';
import { tmpdir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

/**
 * Compilation Service
 * Handles compilation for different programming languages
 * Validates: REQ-6.2, REQ-6.3, REQ-6.10
 */

export interface CompilationConfig {
  language: 'C' | 'CPP' | 'PYTHON' | 'JAVA';
  sourceCode: string;
}

export interface CompilationResult {
  success: boolean;
  binary?: Buffer;
  error?: string;
  compilationTime?: number;
}

/**
 * Language-specific compiler configurations
 */
const LANGUAGE_CONFIG = {
  C: {
    sourceFile: 'solution.c',
    compileCmd: 'gcc -O2 -std=c11 -Wall -Wextra -o /workspace/solution /workspace/solution.c 2>&1',
    binaryFile: '/workspace/solution',
    needsCompilation: true,
  },
  CPP: {
    sourceFile: 'solution.cpp',
    compileCmd: 'g++ -O2 -std=c++17 -Wall -Wextra -o /workspace/solution /workspace/solution.cpp 2>&1',
    binaryFile: '/workspace/solution',
    needsCompilation: true,
  },
  PYTHON: {
    sourceFile: 'solution.py',
    compileCmd: 'python3 -m py_compile /workspace/solution.py 2>&1',
    binaryFile: '/workspace/solution.py',
    needsCompilation: false, // Python is interpreted, but we validate syntax
  },
  JAVA: {
    sourceFile: 'Solution.java',
    compileCmd: 'javac -d /workspace /workspace/Solution.java 2>&1',
    binaryFile: '/workspace/Solution.class',
    needsCompilation: true,
  },
};

/**
 * Compile source code for the specified language
 * Returns compilation result with binary or error messages
 */
export async function compileSourceCode(config: CompilationConfig): Promise<CompilationResult> {
  const { language, sourceCode } = config;
  const langConfig = LANGUAGE_CONFIG[language];
  const containerName = `compile-${randomBytes(8).toString('hex')}`;

  logger.info('Starting compilation', {
    language,
    sourceLength: sourceCode.length,
  });

  const startTime = Date.now();

  try {
    // Create sandbox container
    await createCompilationContainer(containerName, language);

    // Start container first (needed for tmpfs to be available)
    await execAsync(`docker start ${containerName}`);

    // Write source code to container
    await writeSourceToContainer(containerName, langConfig.sourceFile, sourceCode);

    // Compile source code
    const compileResult = await executeCompilation(containerName, langConfig.compileCmd);

    const compilationTime = Date.now() - startTime;

    if (!compileResult.success) {
      logger.warn('Compilation failed', {
        language,
        error: compileResult.error,
        compilationTime,
      });

      return {
        success: false,
        error: compileResult.error,
        compilationTime,
      };
    }

    // For Python, we don't need to read binary
    if (!langConfig.needsCompilation) {
      logger.info('Python syntax validation successful', {
        compilationTime,
      });

      return {
        success: true,
        compilationTime,
      };
    }

    // Read compiled binary
    const binary = await readBinaryFromContainer(containerName, langConfig.binaryFile);

    logger.info('Compilation successful', {
      language,
      compilationTime,
      binarySize: binary.length,
    });

    return {
      success: true,
      binary,
      compilationTime,
    };
  } catch (error) {
    const compilationTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown compilation error';

    logger.error('Compilation error', {
      language,
      error: errorMessage,
      compilationTime,
    });

    return {
      success: false,
      error: errorMessage,
      compilationTime,
    };
  } finally {
    // Clean up container
    await destroySandbox(containerName).catch((err) => {
      logger.warn('Failed to destroy compilation container', {
        containerName,
        error: err.message,
      });
    });
  }
}

/**
 * Create Docker container for compilation
 */
async function createCompilationContainer(containerName: string, language: string): Promise<string> {
  const memoryLimit = 512; // 512MB for compilation

  try {
    const createCmd = [
      'docker create',
      `--name ${containerName}`,
      `--memory=${memoryLimit}m`,
      `--memory-swap=${memoryLimit}m`,
      '--cpus=1',
      '--network=none',
      '--security-opt=no-new-privileges',
      '--cap-drop=ALL',
      '--pids-limit=50',
      'coding-war-judge:latest',
      'sleep 30',
    ].join(' ');

    await execAsync(createCmd);

    logger.debug('Compilation container created', {
      containerName,
      language,
    });

    return containerName;
  } catch (error) {
    logger.error('Failed to create compilation container', {
      containerName,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Failed to create compilation container');
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

    // Copy to container (works with regular filesystem, not tmpfs)
    await execAsync(`docker cp "${tempFile}" ${containerName}:/workspace/${fileName}`);

    // Clean up temp file
    await unlink(tempFile);

    logger.debug('Source code written to container', {
      containerName,
      fileName,
      size: sourceCode.length,
    });
  } catch (error) {
    logger.error('Failed to write source code to container', {
      containerName,
      fileName,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Failed to write source code to container');
  }
}

/**
 * Execute compilation command in container
 */
async function executeCompilation(
  containerName: string,
  compileCmd: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const execCmd = `docker exec ${containerName} sh -c "${compileCmd}"`;
    const { stdout, stderr } = await execAsync(execCmd, {
      timeout: 30000, // 30 seconds for compilation
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    const output = stdout || stderr;

    // Check if compilation was successful (exit code 0)
    logger.debug('Compilation command executed', {
      containerName,
      output: output.substring(0, 500), // Log first 500 chars
    });

    return {
      success: true,
    };
  } catch (error: any) {
    // Compilation failed
    const errorOutput = error.stdout || error.stderr || error.message;

    logger.debug('Compilation command failed', {
      containerName,
      error: errorOutput.substring(0, 500),
    });

    return {
      success: false,
      error: errorOutput,
    };
  }
}

/**
 * Read compiled binary from container
 */
async function readBinaryFromContainer(containerName: string, binaryPath: string): Promise<Buffer> {
  try {
    // Copy binary from container to temp file
    const tempFile = join(tmpdir(), `${containerName}-binary`);
    await execAsync(`docker cp ${containerName}:${binaryPath} "${tempFile}"`);

    // Read binary file
    const fs = await import('fs/promises');
    const binary = await fs.readFile(tempFile);

    // Clean up temp file
    await unlink(tempFile);

    logger.debug('Binary read from container', {
      containerName,
      binaryPath,
      size: binary.length,
    });

    return binary;
  } catch (error) {
    logger.error('Failed to read binary from container', {
      containerName,
      binaryPath,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Failed to read binary from container');
  }
}

/**
 * Validate C source code compilation
 */
export async function compileC(sourceCode: string): Promise<CompilationResult> {
  return compileSourceCode({ language: 'C', sourceCode });
}

/**
 * Validate C++ source code compilation
 */
export async function compileCPP(sourceCode: string): Promise<CompilationResult> {
  return compileSourceCode({ language: 'CPP', sourceCode });
}

/**
 * Validate Python source code syntax
 */
export async function compilePython(sourceCode: string): Promise<CompilationResult> {
  return compileSourceCode({ language: 'PYTHON', sourceCode });
}

/**
 * Validate Java source code compilation
 */
export async function compileJava(sourceCode: string): Promise<CompilationResult> {
  return compileSourceCode({ language: 'JAVA', sourceCode });
}
