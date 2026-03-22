import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { enqueueSubmission } from './submissionQueue';
import { Language, SubmissionStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { emitSubmissionUpdate } from './submissionSocketService';

/**
 * Submission Service
 * Handles submission CRUD operations and queue management
 * Validates: REQ-6.1, REQ-6.7, REQ-6.8, REQ-9.1, REQ-9.2, REQ-9.3, REQ-9.4
 */

export interface CreateSubmissionData {
  userId: string;
  problemId: string;
  language: Language;
  sourceCode: string;
  contestId?: string;
}

export interface SubmissionFilter {
  userId?: string;
  problemId?: string;
  contestId?: string;
  status?: SubmissionStatus;
  page: number;
  limit: number;
}

/**
 * Create a new submission and enqueue it for judging
 * Requirements: REQ-6.1
 */
export async function createSubmission(data: CreateSubmissionData): Promise<{ submissionId: string }> {
  const { userId, problemId, language, sourceCode, contestId } = data;

  // Validate problem exists
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    select: { id: true, timeLimit: true, memoryLimit: true, visibility: true },
  });

  if (!problem) {
    throw new AppError(404, 'PROBLEM_NOT_FOUND', 'Problem not found');
  }

  // If contestId is provided, validate contest and user participation
  let contestRelativeTime: number | undefined;
  if (contestId) {
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        participants: {
          where: { userId },
        },
      },
    });

    if (!contest) {
      throw new AppError(404, 'CONTEST_NOT_FOUND', 'Contest not found');
    }

    // Check if user is registered for contest
    if (contest.participants.length === 0) {
      throw new AppError(403, 'NOT_REGISTERED', 'You are not registered for this contest');
    }

    // Check if contest has started
    const now = new Date();
    if (now < contest.startTime) {
      throw new AppError(403, 'CONTEST_NOT_STARTED', 'Contest has not started yet');
    }

    // Check if contest has ended
    if (now > contest.endTime) {
      throw new AppError(403, 'CONTEST_ENDED', 'Contest has ended');
    }

    // Calculate submission time relative to contest start (in minutes)
    // REQ-11.2: Track submission time relative to contest start time
    contestRelativeTime = Math.floor(
      (now.getTime() - contest.startTime.getTime()) / (1000 * 60)
    );
  }

  // Create submission record with status QUEUED
  const submission = await prisma.submission.create({
    data: {
      userId,
      problemId,
      language,
      sourceCode,
      contestId,
      contestRelativeTime,
      status: 'QUEUED',
    },
  });

  logger.info('Submission created', {
    submissionId: submission.id,
    userId,
    problemId,
    language,
    contestId,
  });

  // Enqueue submission to Bull queue
  await enqueueSubmission({
    submissionId: submission.id,
    userId,
    problemId,
    language,
    sourceCode,
    timeLimit: problem.timeLimit,
    memoryLimit: problem.memoryLimit,
    contestId,
  });

  logger.info('Submission enqueued', {
    submissionId: submission.id,
  });

  // Emit QUEUED status via WebSocket
  emitSubmissionUpdate(submission.id, 'QUEUED');

  return { submissionId: submission.id };
}

/**
 * Get submission by ID with full details
 * Requirements: REQ-6.7, REQ-6.8
 */
export async function getSubmissionById(submissionId: string, requestingUserId?: string, requestingUserRole?: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
      problem: {
        select: {
          id: true,
          title: true,
        },
      },
      testCaseResults: {
        include: {
          testCase: {
            select: {
              id: true,
              orderIndex: true,
            },
          },
        },
        orderBy: {
          testCase: {
            orderIndex: 'asc',
          },
        },
      },
    },
  });

  if (!submission) {
    throw new AppError(404, 'SUBMISSION_NOT_FOUND', 'Submission not found');
  }

  // Authorization: Only allow access to own submissions (or admin)
  if (requestingUserRole !== 'ADMIN' && submission.userId !== requestingUserId) {
    throw new AppError(403, 'ACCESS_DENIED', 'You can only view your own submissions');
  }

  // Format test case results
  const testCaseResults = submission.testCaseResults.map(result => ({
    testCaseId: result.testCaseId,
    status: result.status,
    executionTime: result.executionTime,
    memoryUsed: result.memoryUsed,
  }));

  return {
    id: submission.id,
    problemId: submission.problemId,
    problemTitle: submission.problem.title,
    userId: submission.userId,
    username: submission.user.username,
    language: submission.language,
    sourceCode: submission.sourceCode,
    status: submission.status,
    verdict: submission.verdict,
    executionTime: submission.executionTime,
    memoryUsed: submission.memoryUsed,
    testCaseResults: testCaseResults.length > 0 ? testCaseResults : undefined,
    compilationError: submission.compilationError,
    submittedAt: submission.submittedAt.toISOString(),
    judgedAt: submission.judgedAt?.toISOString(),
  };
}

/**
 * List submissions with filtering and pagination
 * Requirements: REQ-9.1, REQ-9.2, REQ-9.3, REQ-9.4
 */
export async function listSubmissions(
  filter: SubmissionFilter,
  requestingUserId?: string,
  requestingUserRole?: string
) {
  const { userId, problemId, contestId, status, page, limit } = filter;

  // Build where clause
  const where: any = {};

  // Non-admin users can only see their own submissions
  if (requestingUserRole !== 'ADMIN') {
    where.userId = requestingUserId;
  } else if (userId) {
    // Admin can filter by userId
    where.userId = userId;
  }

  if (problemId) {
    where.problemId = problemId;
  }

  if (contestId) {
    where.contestId = contestId;
  }

  if (status) {
    where.status = status;
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Query submissions
  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        submittedAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        problem: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
    prisma.submission.count({ where }),
  ]);

  // Format submissions
  const formattedSubmissions = submissions.map(submission => ({
    id: submission.id,
    problemId: submission.problemId,
    problemTitle: submission.problem.title,
    userId: submission.userId,
    username: submission.user.username,
    language: submission.language,
    status: submission.status,
    verdict: submission.verdict,
    executionTime: submission.executionTime,
    memoryUsed: submission.memoryUsed,
    submittedAt: submission.submittedAt.toISOString(),
    judgedAt: submission.judgedAt?.toISOString(),
  }));

  return {
    submissions: formattedSubmissions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Rejudge a submission (Admin only)
 * Requirements: REQ-13.6, REQ-13.7
 */
export async function rejudgeSubmission(submissionId: string): Promise<void> {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      problem: {
        select: {
          timeLimit: true,
          memoryLimit: true,
        },
      },
    },
  });

  if (!submission) {
    throw new AppError(404, 'SUBMISSION_NOT_FOUND', 'Submission not found');
  }

  // Reset submission status to QUEUED
  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: 'QUEUED',
      verdict: null,
      executionTime: null,
      memoryUsed: null,
      compilationError: null,
      judgedAt: null,
    },
  });

  // Delete existing test case results
  await prisma.testCaseResult.deleteMany({
    where: { submissionId },
  });

  // Re-enqueue submission
  await enqueueSubmission({
    submissionId: submission.id,
    userId: submission.userId,
    problemId: submission.problemId,
    language: submission.language,
    sourceCode: submission.sourceCode,
    timeLimit: submission.problem.timeLimit,
    memoryLimit: submission.problem.memoryLimit,
    contestId: submission.contestId || undefined,
  });

  logger.info('Submission rejudged', {
    submissionId,
  });

  // Emit QUEUED status via WebSocket
  emitSubmissionUpdate(submissionId, 'QUEUED');
}
