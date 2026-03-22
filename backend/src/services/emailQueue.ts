import Queue from 'bull';
import { logger } from '../utils/logger';

/**
 * Email Queue Service
 * Manages email sending queue with Bull and Redis
 * Implements retry logic and job processing
 * Validates: REQ-14.5, REQ-14.6, REQ-14.7
 */

interface EmailJobData {
  to: string;
  subject: string;
  html: string;
}

// Create Bull queue for email sending
export const emailQueue = new Queue<EmailJobData>('email-queue', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 seconds, then 4s, 8s
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

/**
 * Process email queue jobs
 * This will be called by the queue worker
 */
emailQueue.process('send-email', async (job) => {
  const { to, subject, html } = job.data;
  const attemptNumber = job.attemptsMade + 1;

  logger.info('Processing email job', {
    jobId: job.id,
    to,
    subject,
    attempt: attemptNumber,
    maxAttempts: job.opts.attempts,
  });

  // Import sendEmail here to avoid circular dependency
  const { sendEmail } = await import('./emailService');
  
  try {
    await sendEmail({ to, subject, html });
    
    logger.info('Email job completed successfully', {
      jobId: job.id,
      to,
      subject,
      attempt: attemptNumber,
    });
  } catch (error) {
    logger.error('Email job failed', {
      jobId: job.id,
      to,
      subject,
      attempt: attemptNumber,
      maxAttempts: job.opts.attempts,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // Re-throw to trigger Bull's retry mechanism
    throw error;
  }
});

/**
 * Event handlers for queue monitoring
 */
emailQueue.on('completed', (job) => {
  logger.info('Email queue job completed', {
    jobId: job.id,
    to: job.data.to,
    subject: job.data.subject,
  });
});

emailQueue.on('failed', (job, err) => {
  logger.error('Email queue job failed permanently', {
    jobId: job?.id,
    to: job?.data.to,
    subject: job?.data.subject,
    attempts: job?.attemptsMade,
    error: err.message,
  });
});

emailQueue.on('stalled', (job) => {
  logger.warn('Email queue job stalled', {
    jobId: job.id,
    to: job.data.to,
    subject: job.data.subject,
  });
});

emailQueue.on('error', (error) => {
  logger.error('Email queue error', {
    error: error.message,
  });
});

/**
 * Graceful shutdown handler
 */
export async function closeEmailQueue(): Promise<void> {
  logger.info('Closing email queue...');
  await emailQueue.close();
  logger.info('Email queue closed');
}
