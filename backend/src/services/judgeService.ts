/**
 * Judge Service
 * Main judge worker process for submission evaluation
 * Validates: REQ-6.1, REQ-6.2, REQ-6.3, REQ-6.4, REQ-6.9
 * Security: SDD 3.2.4 (Verify SHA-256 before execution)
 */

import { logger } from '../utils/logger';
import prisma from '../utils/prisma';
import type { SubmissionJobData } from './submissionQueue';
import { compileSourceCode } from './compilationService';
import { executeTestCase } from './executionService';
import { SubmissionStatus } from '@prisma/client';
import { emitSubmissionUpdate, emitSubmissionComplete } from './submissionSocketService';
import { invalidateScoreboardCache } from './scoreboardService';
import { emitScoreboardUpdate } from './scoreboardSocketService';
import { downloadTestCaseFile } from './s3Service';
import { verifySHA256 } from '../utils/checksumUtils';
import { AppError } from '../middleware/errorHandler';

/**
 * Main judge submission function
 * Processes a submission through compilation and test case execution
 */
export async function judgeSubmission(data: SubmissionJobData): Promise<void> {
  const { submissionId, userId, problemId, language, sourceCode, timeLimit, memoryLimit, contestId } = data;

  logger.info('Starting submission judging', {
    submissionId,
    userId,
    problemId,
    language,
    contestId,
  });

  try {
    // Step 1: Update submission status to COMPILING
    await updateSubmissionStatus(submissionId, SubmissionStatus.COMPILING);
    emitSubmissionUpdate(submissionId, 'COMPILING');
    logger.debug('Submission status updated to COMPILING', { submissionId });

    // Step 2: Compile source code
    const compilationResult = await compileSourceCode({
      language,
      sourceCode,
    });

    // Step 3: If compilation fails, save error and return
    if (!compilationResult.success) {
      logger.warn('Compilation failed', {
        submissionId,
        error: compilationResult.error,
      });

      await updateSubmissionWithCompilationError(submissionId, compilationResult.error || 'Unknown compilation error');
      
      // Emit completion event with compilation error
      emitSubmissionComplete(submissionId, 'COMPILATION_ERROR', 0, 0, []);
      
      return;
    }

    logger.info('Compilation successful', {
      submissionId,
      compilationTime: compilationResult.compilationTime,
    });

    // Step 4: Update submission status to RUNNING
    await updateSubmissionStatus(submissionId, SubmissionStatus.RUNNING);
    emitSubmissionUpdate(submissionId, 'RUNNING');
    logger.debug('Submission status updated to RUNNING', { submissionId });

    // Step 5: Get test cases for the problem
    const testCases = await getTestCases(problemId);

    if (testCases.length === 0) {
      logger.error('No test cases found for problem', {
        submissionId,
        problemId,
      });

      await updateSubmissionWithError(submissionId, 'No test cases available for this problem');
      
      // Emit completion event with error
      emitSubmissionComplete(submissionId, 'RUNTIME_ERROR', 0, 0, []);
      
      return;
    }

    logger.debug('Retrieved test cases', {
      submissionId,
      problemId,
      testCaseCount: testCases.length,
    });

    // Step 6: Execute against all test cases sequentially
    const testCaseResults = [];
    let allAccepted = true;
    let finalVerdict: SubmissionStatus = SubmissionStatus.ACCEPTED;
    let totalExecutionTime = 0;
    let maxMemoryUsed = 0;

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];

      logger.debug('Executing test case', {
        submissionId,
        testCaseIndex: i + 1,
        totalTestCases: testCases.length,
      });

      // Emit progress update
      emitSubmissionUpdate(submissionId, 'RUNNING', {
        current: i + 1,
        total: testCases.length,
      });

      const executionResult = await executeTestCase({
        language,
        sourceCode: language === 'PYTHON' ? sourceCode : undefined,
        binary: compilationResult.binary,
        input: testCase.inputFile,
        expectedOutput: testCase.outputFile,
        timeLimit,
        memoryLimit,
      });

      // Save test case result to database
      await saveTestCaseResult(submissionId, testCase.id, executionResult);

      testCaseResults.push({
        testCaseId: testCase.id,
        verdict: executionResult.verdict,
        status: mapVerdictToStatus(executionResult.verdict),
        executionTime: executionResult.executionTime,
        memoryUsed: executionResult.memoryUsed,
      });

      // Track metrics
      totalExecutionTime += executionResult.executionTime;
      maxMemoryUsed = Math.max(maxMemoryUsed, executionResult.memoryUsed);

      // Update final verdict based on test case result
      if (executionResult.verdict !== 'ACCEPTED') {
        allAccepted = false;
        finalVerdict = mapVerdictToStatus(executionResult.verdict);

        logger.debug('Test case failed', {
          submissionId,
          testCaseIndex: i + 1,
          verdict: executionResult.verdict,
        });

        // For ACM contests, stop on first failure
        // For IOI contests, continue to run all test cases
        // Since we don't have contest scoring rule here, we'll run all test cases
      }
    }

    // Step 7: Calculate final verdict
    // If all test cases passed, verdict is ACCEPTED
    // Otherwise, use the first non-ACCEPTED verdict
    if (allAccepted) {
      finalVerdict = SubmissionStatus.ACCEPTED;
    }

    logger.info('All test cases executed', {
      submissionId,
      finalVerdict,
      totalExecutionTime,
      maxMemoryUsed,
      testCaseResults: testCaseResults.length,
    });

    // Step 8: Update submission with final verdict and metrics
    await updateSubmissionWithVerdict(submissionId, {
      status: finalVerdict,
      verdict: finalVerdict,
      executionTime: Math.round(totalExecutionTime / testCases.length), // Average execution time
      memoryUsed: Math.round(maxMemoryUsed),
    });

    // Emit completion event with full results
    emitSubmissionComplete(
      submissionId,
      finalVerdict,
      Math.round(totalExecutionTime / testCases.length),
      Math.round(maxMemoryUsed),
      testCaseResults
    );

    logger.info('Submission judging completed', {
      submissionId,
      finalVerdict,
      executionTime: Math.round(totalExecutionTime / testCases.length),
      memoryUsed: Math.round(maxMemoryUsed),
    });

    // If this submission is part of a contest, update scoreboard
    if (contestId) {
      logger.debug('Updating scoreboard for contest', {
        submissionId,
        contestId,
      });

      // Invalidate scoreboard cache
      await invalidateScoreboardCache(contestId);

      // Emit scoreboard update via WebSocket
      await emitScoreboardUpdate(contestId);

      logger.info('Scoreboard updated for contest', {
        submissionId,
        contestId,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown judging error';

    logger.error('Judging error', {
      submissionId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Update submission with error
    await updateSubmissionWithError(submissionId, errorMessage);

    // Re-throw to mark job as failed
    throw error;
  }
}

/**
 * Update submission status
 */
async function updateSubmissionStatus(submissionId: string, status: SubmissionStatus): Promise<void> {
  await prisma.submission.update({
    where: { id: submissionId },
    data: { status },
  });
}

/**
 * Update submission with compilation error
 */
async function updateSubmissionWithCompilationError(submissionId: string, error: string): Promise<void> {
  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: SubmissionStatus.COMPILATION_ERROR,
      verdict: 'COMPILATION_ERROR',
      compilationError: error,
      judgedAt: new Date(),
    },
  });
}

/**
 * Update submission with final verdict and metrics
 */
async function updateSubmissionWithVerdict(
  submissionId: string,
  data: {
    status: SubmissionStatus;
    verdict: string;
    executionTime: number;
    memoryUsed: number;
  }
): Promise<void> {
  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: data.status,
      verdict: data.verdict,
      executionTime: data.executionTime,
      memoryUsed: data.memoryUsed,
      judgedAt: new Date(),
    },
  });
}

/**
 * Update submission with error
 */
async function updateSubmissionWithError(submissionId: string, error: string): Promise<void> {
  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: SubmissionStatus.RUNTIME_ERROR,
      verdict: 'RUNTIME_ERROR',
      compilationError: error,
      judgedAt: new Date(),
    },
  });
}

/**
 * Get test cases for a problem with S3 download and SHA-256 verification
 * SDD 3.2.4: Resource Downloader — Verify SHA-256 before execution
 */
async function getTestCases(problemId: string): Promise<Array<{
  id: string;
  inputFile: string;
  outputFile: string;
  orderIndex: number;
}>> {
  // Step 1: Fetch testcase metadata from database (S3 keys + checksums)
  const testCaseMeta = await prisma.testCase.findMany({
    where: { problemId },
    orderBy: { orderIndex: 'asc' },
    select: {
      id: true,
      inputFile: true,       // S3 key
      outputFile: true,      // S3 key
      inputChecksum: true,   // SHA-256 hex digest
      outputChecksum: true,  // SHA-256 hex digest
      orderIndex: true,
    },
  });

  // Step 2: Download from S3 and verify checksums
  const testCases = await Promise.all(
    testCaseMeta.map(async (tc) => {
      // Download input and output files from S3
      const inputBuffer = await downloadTestCaseFile(tc.inputFile);
      const outputBuffer = await downloadTestCaseFile(tc.outputFile);

      // Verify SHA-256 checksums (SDD 3.2.4 — defense-in-depth)
      if (!verifySHA256(inputBuffer, tc.inputChecksum)) {
        logger.error('Testcase input integrity check failed', {
          problemId,
          testCaseId: tc.id,
          s3Key: tc.inputFile,
        });
        throw new AppError(
          500,
          'TESTCASE_INTEGRITY_ERROR',
          `Testcase input integrity check failed for test case ${tc.id}`
        );
      }

      if (!verifySHA256(outputBuffer, tc.outputChecksum)) {
        logger.error('Testcase output integrity check failed', {
          problemId,
          testCaseId: tc.id,
          s3Key: tc.outputFile,
        });
        throw new AppError(
          500,
          'TESTCASE_INTEGRITY_ERROR',
          `Testcase output integrity check failed for test case ${tc.id}`
        );
      }

      logger.debug('Testcase integrity verified', {
        testCaseId: tc.id,
        orderIndex: tc.orderIndex,
      });

      return {
        id: tc.id,
        inputFile: inputBuffer.toString('utf8'),
        outputFile: outputBuffer.toString('utf8'),
        orderIndex: tc.orderIndex,
      };
    })
  );

  return testCases;
}

/**
 * Save test case result to database
 */
async function saveTestCaseResult(
  submissionId: string,
  testCaseId: string,
  result: {
    verdict: string;
    stdout: string;
    executionTime: number;
    memoryUsed: number;
  }
): Promise<void> {
  await prisma.testCaseResult.create({
    data: {
      submissionId,
      testCaseId,
      status: mapVerdictToStatus(result.verdict),
      executionTime: result.executionTime,
      memoryUsed: result.memoryUsed,
      output: result.stdout.substring(0, 10000), // Limit output to 10KB
    },
  });
}

/**
 * Map execution verdict to submission status
 */
function mapVerdictToStatus(verdict: string): SubmissionStatus {
  switch (verdict) {
    case 'ACCEPTED':
      return SubmissionStatus.ACCEPTED;
    case 'WRONG_ANSWER':
      return SubmissionStatus.WRONG_ANSWER;
    case 'TIME_LIMIT_EXCEEDED':
      return SubmissionStatus.TIME_LIMIT_EXCEEDED;
    case 'MEMORY_LIMIT_EXCEEDED':
      return SubmissionStatus.MEMORY_LIMIT_EXCEEDED;
    case 'RUNTIME_ERROR':
      return SubmissionStatus.RUNTIME_ERROR;
    case 'COMPILATION_ERROR':
      return SubmissionStatus.COMPILATION_ERROR;
    default:
      return SubmissionStatus.RUNTIME_ERROR;
  }
}
