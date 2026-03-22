import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type { Job } from 'bull';

/**
 * Email Queue Tests
 * Tests queue configuration, job processing, and retry logic
 */

// Mock Bull queue
const mockProcess = jest.fn<any>();
const mockOn = jest.fn<any>();
const mockAdd = jest.fn<any>();
const mockClose = jest.fn<any>();

const mockQueueInstance = {
  process: mockProcess,
  on: mockOn,
  add: mockAdd,
  close: mockClose,
};

const mockBullConstructor = jest.fn<any>().mockReturnValue(mockQueueInstance);

jest.mock('bull', () => mockBullConstructor);
jest.mock('../../src/utils/logger');

describe('Email Queue', () => {
  let mockJob: Partial<Job>;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    mockAdd.mockResolvedValue({ id: 'test-job-id' });
    mockClose.mockResolvedValue(undefined);

    // Setup mock job
    mockJob = {
      id: 'test-job-123',
      data: {
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      },
      attemptsMade: 0,
      opts: {
        attempts: 3,
      },
    };

    // Set environment variables
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';
    delete process.env.REDIS_PASSWORD;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Queue Configuration', () => {
    it('should create queue with correct Redis configuration', async () => {
      // Clear modules to force re-import
      jest.resetModules();
      
      await import('./emailQueue');

      expect(mockBullConstructor).toHaveBeenCalledWith(
        'email-queue',
        expect.objectContaining({
          redis: {
            host: 'localhost',
            port: 6379,
            password: undefined,
          },
        })
      );
    });

    it('should configure default job options with retry logic', async () => {
      jest.resetModules();
      
      await import('./emailQueue');

      expect(mockBullConstructor).toHaveBeenCalledWith(
        'email-queue',
        expect.objectContaining({
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            removeOnComplete: true,
            removeOnFail: false,
          },
        })
      );
    });

    it('should use Redis password if provided', async () => {
      jest.resetModules();
      process.env.REDIS_PASSWORD = 'test-password';

      await import('./emailQueue');

      expect(mockBullConstructor).toHaveBeenCalledWith(
        'email-queue',
        expect.objectContaining({
          redis: expect.objectContaining({
            password: 'test-password',
          }),
        })
      );
    });
  });

  describe('Job Processing', () => {
    beforeEach(async () => {
      jest.resetModules();
      await import('./emailQueue');
    });

    it('should process email jobs', () => {
      expect(mockProcess).toHaveBeenCalledWith('send-email', expect.any(Function));
    });

    it('should log job processing start', async () => {
      const logger = await import('../utils/logger');
      
      // Get the processor function
      const processorCall = mockProcess.mock.calls.find(
        (call: any[]) => call[0] === 'send-email'
      );
      if (!processorCall) throw new Error('Processor not registered');
      const processor = processorCall[1] as (job: Partial<Job>) => Promise<void>;

      // Mock sendEmail
      const mockSendEmail = jest.fn<any>().mockResolvedValue(true);
      jest.doMock('./emailService', () => ({
        sendEmail: mockSendEmail,
      }));

      await processor(mockJob);

      expect(logger.logger.info).toHaveBeenCalledWith(
        'Processing email job',
        expect.objectContaining({
          jobId: 'test-job-123',
          to: 'user@example.com',
          subject: 'Test Email',
          attempt: 1,
          maxAttempts: 3,
        })
      );
    });

    it('should log successful job completion', async () => {
      const logger = await import('../utils/logger');
      
      const processorCall = mockProcess.mock.calls.find(
        (call: any[]) => call[0] === 'send-email'
      );
      if (!processorCall) throw new Error('Processor not registered');
      const processor = processorCall[1] as (job: Partial<Job>) => Promise<void>;

      // Mock successful sendEmail
      const mockSendEmail = jest.fn<any>().mockResolvedValue(true);
      jest.doMock('./emailService', () => ({
        sendEmail: mockSendEmail,
      }));

      await processor(mockJob);

      expect(logger.logger.info).toHaveBeenCalledWith(
        'Email job completed successfully',
        expect.objectContaining({
          jobId: 'test-job-123',
          to: 'user@example.com',
          subject: 'Test Email',
          attempt: 1,
        })
      );
    });

    it('should log and re-throw error on job failure', async () => {
      const logger = await import('../utils/logger');
      
      const processorCall = mockProcess.mock.calls.find(
        (call: any[]) => call[0] === 'send-email'
      );
      if (!processorCall) throw new Error('Processor not registered');
      const processor = processorCall[1] as (job: Partial<Job>) => Promise<void>;

      // Mock failed sendEmail
      const error = new Error('SMTP connection failed');
      const mockSendEmail = jest.fn<any>().mockRejectedValue(error);
      jest.doMock('./emailService', () => ({
        sendEmail: mockSendEmail,
      }));

      await expect(processor(mockJob)).rejects.toThrow('SMTP connection failed');

      expect(logger.logger.error).toHaveBeenCalledWith(
        'Email job failed',
        expect.objectContaining({
          jobId: 'test-job-123',
          to: 'user@example.com',
          subject: 'Test Email',
          error: 'SMTP connection failed',
        })
      );
    });

    it('should track attempt number correctly', async () => {
      const logger = await import('../utils/logger');
      
      const processorCall = mockProcess.mock.calls.find(
        (call: any[]) => call[0] === 'send-email'
      );
      if (!processorCall) throw new Error('Processor not registered');
      const processor = processorCall[1] as (job: Partial<Job>) => Promise<void>;

      // Simulate second attempt
      const jobWithRetry = {
        ...mockJob,
        attemptsMade: 1,
      };

      const mockSendEmail = jest.fn<any>().mockResolvedValue(true);
      jest.doMock('./emailService', () => ({
        sendEmail: mockSendEmail,
      }));

      await processor(jobWithRetry);

      expect(logger.logger.info).toHaveBeenCalledWith(
        'Processing email job',
        expect.objectContaining({
          attempt: 2,
        })
      );
    });
  });

  describe('Event Handlers', () => {
    beforeEach(async () => {
      jest.resetModules();
      await import('./emailQueue');
    });

    it('should register completed event handler', () => {
      expect(mockOn).toHaveBeenCalledWith('completed', expect.any(Function));
    });

    it('should register failed event handler', () => {
      expect(mockOn).toHaveBeenCalledWith('failed', expect.any(Function));
    });

    it('should register stalled event handler', () => {
      expect(mockOn).toHaveBeenCalledWith('stalled', expect.any(Function));
    });

    it('should register error event handler', () => {
      expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should log completed jobs', async () => {
      const logger = await import('../utils/logger');
      
      const completedHandlerCall = mockOn.mock.calls.find(
        (call: any[]) => call[0] === 'completed'
      );
      if (!completedHandlerCall) throw new Error('Completed handler not registered');
      const completedHandler = completedHandlerCall[1] as (job: Partial<Job>) => void;

      completedHandler(mockJob);

      expect(logger.logger.info).toHaveBeenCalledWith(
        'Email queue job completed',
        expect.objectContaining({
          jobId: 'test-job-123',
          to: 'user@example.com',
          subject: 'Test Email',
        })
      );
    });

    it('should log permanently failed jobs', async () => {
      const logger = await import('../utils/logger');
      
      const failedHandlerCall = mockOn.mock.calls.find(
        (call: any[]) => call[0] === 'failed'
      );
      if (!failedHandlerCall) throw new Error('Failed handler not registered');
      const failedHandler = failedHandlerCall[1] as (job: Partial<Job>, error: Error) => void;

      const error = new Error('Max retries exceeded');
      failedHandler(mockJob, error);

      expect(logger.logger.error).toHaveBeenCalledWith(
        'Email queue job failed permanently',
        expect.objectContaining({
          jobId: 'test-job-123',
          error: 'Max retries exceeded',
        })
      );
    });

    it('should log stalled jobs', async () => {
      const logger = await import('../utils/logger');
      
      const stalledHandlerCall = mockOn.mock.calls.find(
        (call: any[]) => call[0] === 'stalled'
      );
      if (!stalledHandlerCall) throw new Error('Stalled handler not registered');
      const stalledHandler = stalledHandlerCall[1] as (job: Partial<Job>) => void;

      stalledHandler(mockJob);

      expect(logger.logger.warn).toHaveBeenCalledWith(
        'Email queue job stalled',
        expect.objectContaining({
          jobId: 'test-job-123',
        })
      );
    });

    it('should log queue errors', async () => {
      const logger = await import('../utils/logger');
      
      const errorHandlerCall = mockOn.mock.calls.find(
        (call: any[]) => call[0] === 'error'
      );
      if (!errorHandlerCall) throw new Error('Error handler not registered');
      const errorHandler = errorHandlerCall[1] as (error: Error) => void;

      const error = new Error('Redis connection lost');
      errorHandler(error);

      expect(logger.logger.error).toHaveBeenCalledWith(
        'Email queue error',
        expect.objectContaining({
          error: 'Redis connection lost',
        })
      );
    });
  });

  describe('Graceful Shutdown', () => {
    it('should close queue gracefully', async () => {
      jest.resetModules();
      const logger = await import('../utils/logger');
      const { closeEmailQueue } = await import('./emailQueue');

      await closeEmailQueue();

      expect(mockClose).toHaveBeenCalled();
      expect(logger.logger.info).toHaveBeenCalledWith('Closing email queue...');
      expect(logger.logger.info).toHaveBeenCalledWith('Email queue closed');
    });
  });
});
