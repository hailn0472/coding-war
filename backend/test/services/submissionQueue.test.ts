import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { Job } from 'bull';

/**
 * Unit tests for Submission Queue Service
 * Tests queue configuration, job processing, and monitoring
 */

// Mock Bull queue
const mockQueue = {
  add: jest.fn<any>(),
  process: jest.fn<any>(),
  on: jest.fn<any>(),
  close: jest.fn<any>(),
  getWaitingCount: jest.fn<any>(),
  getActiveCount: jest.fn<any>(),
  getCompletedCount: jest.fn<any>(),
  getFailedCount: jest.fn<any>(),
  getDelayedCount: jest.fn<any>(),
};

jest.mock('bull', () => {
  return jest.fn(() => mockQueue);
});

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Submission Queue Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('enqueueSubmission', () => {
    it('should add submission to queue with correct data', async () => {
      const mockJob = { id: '123' } as Job;
      mockQueue.add.mockResolvedValue(mockJob);

      const { enqueueSubmission } = await import('./submissionQueue');

      const submissionData = {
        submissionId: 'sub-123',
        userId: 'user-456',
        problemId: 'prob-789',
        language: 'CPP' as const,
        sourceCode: '#include <iostream>\nint main() { return 0; }',
        timeLimit: 1000,
        memoryLimit: 256,
      };

      const jobId = await enqueueSubmission(submissionData);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'judge-submission',
        submissionData,
        expect.objectContaining({
          priority: 10, // Non-contest submission
        })
      );
      expect(jobId).toBe('123');
    });

    it('should prioritize contest submissions', async () => {
      const mockJob = { id: '456' } as Job;
      mockQueue.add.mockResolvedValue(mockJob);

      const { enqueueSubmission } = await import('./submissionQueue');

      const submissionData = {
        submissionId: 'sub-123',
        userId: 'user-456',
        problemId: 'prob-789',
        language: 'PYTHON' as const,
        sourceCode: 'print("Hello")',
        timeLimit: 2000,
        memoryLimit: 512,
        contestId: 'contest-999',
      };

      await enqueueSubmission(submissionData);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'judge-submission',
        submissionData,
        expect.objectContaining({
          priority: 1, // Contest submission has higher priority
        })
      );
    });
  });

  describe('getQueueMetrics', () => {
    it('should return queue metrics', async () => {
      mockQueue.getWaitingCount.mockResolvedValue(5);
      mockQueue.getActiveCount.mockResolvedValue(2);
      mockQueue.getCompletedCount.mockResolvedValue(100);
      mockQueue.getFailedCount.mockResolvedValue(3);
      mockQueue.getDelayedCount.mockResolvedValue(0);

      const { getQueueMetrics } = await import('./submissionQueue');

      const metrics = await getQueueMetrics();

      expect(metrics).toEqual({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 0,
        total: 110,
      });
    });
  });

  describe('closeSubmissionQueue', () => {
    it('should close queue gracefully', async () => {
      mockQueue.close.mockResolvedValue(undefined);

      const { closeSubmissionQueue } = await import('./submissionQueue');

      await closeSubmissionQueue();

      expect(mockQueue.close).toHaveBeenCalled();
    });
  });
});
