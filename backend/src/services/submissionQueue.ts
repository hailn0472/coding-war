import Queue from 'bull';
import { logger } from '../utils/logger';

/**
 * Submission Queue Service
 * Manages code submission judging queue with Bull and Redis
 * Implements concurrent processing and job monitoring
 * Validates: REQ-6.1, REQ-6.9
 */

export interface SubmissionJobData {
  submissionId: string;
  userId: string;
  problemId: string;
  language: 'C' | 'CPP' | 'PYTHON' | 'JAVA';
  sourceCode: string;
  timeLimit: number;      // milliseconds
  memoryLimit: number;    // MB
  contestId?: string;
}

// Create Bull queue for submission processing
export const submissionQueue = new Queue<SubmissionJobData>('submission-queue', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  defaultJobOptions: {
    attempts: 1, // No retries for submissions - they should be rejudged manually if needed
    removeOnComplete: 100, // Keep last 100 completed jobs for monitoring
    removeOnFail: false,   // Keep failed jobs for debugging
    timeout: parseInt(process.env.JUDGE_TIMEOUT || '30000'), // 30 seconds default
  },
});

/**
 * Configure queue concurrency based on environment
 */
const JUDGE_CONCURRENCY = parseInt(process.env.JUDGE_CONCURRENCY || '4');

/**
 * Process submission queue jobs
 * This will be called by the queue worker
 */
submissionQueue.process('judge-submission', JUDGE_CONCURRENCY, async (job) => {
  const { submissionId, userId, problemId, language, sourceCode, timeLimit, memoryLimit, contestId } = job.data;

  logger.info('Processing submission job', {
    jobId: job.id,
    submissionId,
    userId,
    problemId,
    language,
    timeLimit,
    memoryLimit,
    contestId,
  });

  // Import judgeService here to avoid circular dependency
  const { judgeSubmission } = await import('./judgeService');
  
  try {
    await judgeSubmission({
      submissionId,
      userId,
      problemId,
      language,
      sourceCode,
      timeLimit,
      memoryLimit,
      contestId,
    });
    
    logger.info('Submission job completed successfully', {
      jobId: job.id,
      submissionId,
      problemId,
    });
  } catch (error) {
    logger.error('Submission job failed', {
      jobId: job.id,
      submissionId,
      problemId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Re-throw to mark job as failed
    throw error;
  }
});

/**
 * Event handlers for queue monitoring
 */
submissionQueue.on('completed', (job) => {
  logger.info('Submission queue job completed', {
    jobId: job.id,
    submissionId: job.data.submissionId,
    problemId: job.data.problemId,
    processingTime: Date.now() - job.processedOn!,
  });
});

submissionQueue.on('failed', (job, err) => {
  logger.error('Submission queue job failed', {
    jobId: job?.id,
    submissionId: job?.data.submissionId,
    problemId: job?.data.problemId,
    error: err.message,
    stack: err.stack,
  });
});

submissionQueue.on('stalled', (job) => {
  logger.warn('Submission queue job stalled', {
    jobId: job.id,
    submissionId: job.data.submissionId,
    problemId: job.data.problemId,
    stalledAt: new Date().toISOString(),
  });
});

submissionQueue.on('error', (error) => {
  logger.error('Submission queue error', {
    error: error.message,
    stack: error.stack,
  });
});

submissionQueue.on('active', (job) => {
  logger.debug('Submission queue job started', {
    jobId: job.id,
    submissionId: job.data.submissionId,
    problemId: job.data.problemId,
  });
});

/**
 * Get queue metrics for monitoring
 */
export async function getQueueMetrics() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    submissionQueue.getWaitingCount(),
    submissionQueue.getActiveCount(),
    submissionQueue.getCompletedCount(),
    submissionQueue.getFailedCount(),
    submissionQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

/**
 * Add submission to queue
 */
export async function enqueueSubmission(data: SubmissionJobData): Promise<string> {
  const job = await submissionQueue.add('judge-submission', data, {
    priority: data.contestId ? 1 : 10, // Contest submissions have higher priority
  });

  logger.info('Submission enqueued', {
    jobId: job.id,
    submissionId: data.submissionId,
    problemId: data.problemId,
    priority: data.contestId ? 1 : 10,
  });

  return job.id?.toString() || '';
}

/**
 * Graceful shutdown handler
 */
export async function closeSubmissionQueue(): Promise<void> {
  logger.info('Closing submission queue...');
  await submissionQueue.close();
  logger.info('Submission queue closed');
}
