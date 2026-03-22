import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Socket } from 'socket.io';

/**
 * Submission Socket Service Tests
 * Tests submission-specific WebSocket events and authorization
 * Validates: REQ-8.2, REQ-8.3, REQ-8.4
 */

// Mock dependencies
jest.mock('../../src/../src/services/socketService');
jest.mock('../../src/utils/logger');
jest.mock('../../src/utils/prisma', () => ({
  __esModule: true,
  default: {
    submission: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Submission Socket Service', () => {
  let mockSocket: Partial<Socket>;
  let mockIo: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSocket = {
      id: 'test-socket-id',
      data: {
        userId: 'user-123',
        role: 'user',
      },
      join: jest.fn<(rooms: string | string[]) => void>(),
      leave: jest.fn<(room: string) => void>(),
      emit: jest.fn<(ev: string, ...args: any[]) => boolean>(),
      on: jest.fn<(ev: string, listener: (...args: any[]) => void) => any>(),
    };

    mockIo = {
      on: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    const { getSocketServer } = require('./socketService');
    (getSocketServer as jest.MockedFunction<typeof getSocketServer>).mockReturnValue(mockIo);
  });

  describe('initializeSubmissionSocketHandlers', () => {
    it('should register connection handler', async () => {
      const { initializeSubmissionSocketHandlers } = await import('../../src/services/submissionSocketService');

      initializeSubmissionSocketHandlers();

      expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });
  });

  describe('subscribe:submission event', () => {
    it('should allow user to subscribe to their own submission', async () => {
      const prisma = (await import('../../src/utils/prisma')).default;
      (prisma.submission.findUnique as jest.MockedFunction<any>).mockResolvedValue({
        id: 'submission-123',
        userId: 'user-123',
      });

      const { initializeSubmissionSocketHandlers } = await import('../../src/services/submissionSocketService');
      initializeSubmissionSocketHandlers();

      const connectionHandler = mockIo.on.mock.calls.find((call: any) => call[0] === 'connection')?.[1];
      if (connectionHandler) {
        connectionHandler(mockSocket);
      }

      const subscribeHandler = (mockSocket.on as jest.MockedFunction<any>).mock.calls.find(
        (call: any) => call[0] === 'subscribe:submission'
      )?.[1];

      if (subscribeHandler) {
        await subscribeHandler({ submissionId: 'submission-123' });
      }

      expect(mockSocket.join).toHaveBeenCalledWith('submission:submission-123');
      expect(mockSocket.emit).toHaveBeenCalledWith('subscribed:submission', { submissionId: 'submission-123' });
    });

    it('should allow admin to subscribe to any submission', async () => {
      mockSocket.data = {
        userId: 'admin-123',
        role: 'admin',
      };

      const prisma = (await import('../../src/utils/prisma')).default;
      (prisma.submission.findUnique as jest.MockedFunction<any>).mockResolvedValue({
        id: 'submission-456',
        userId: 'other-user',
      });

      const { initializeSubmissionSocketHandlers } = await import('../../src/services/submissionSocketService');
      initializeSubmissionSocketHandlers();

      const connectionHandler = mockIo.on.mock.calls.find((call: any) => call[0] === 'connection')?.[1];
      if (connectionHandler) {
        connectionHandler(mockSocket);
      }

      const subscribeHandler = (mockSocket.on as jest.MockedFunction<any>).mock.calls.find(
        (call: any) => call[0] === 'subscribe:submission'
      )?.[1];

      if (subscribeHandler) {
        await subscribeHandler({ submissionId: 'submission-456' });
      }

      expect(mockSocket.join).toHaveBeenCalledWith('submission:submission-456');
    });

    it('should reject subscription to other users submissions', async () => {
      const prisma = (await import('../../src/utils/prisma')).default;
      (prisma.submission.findUnique as jest.MockedFunction<any>).mockResolvedValue({
        id: 'submission-789',
        userId: 'other-user',
      });

      const { initializeSubmissionSocketHandlers } = await import('../../src/services/submissionSocketService');
      initializeSubmissionSocketHandlers();

      const connectionHandler = mockIo.on.mock.calls.find((call: any) => call[0] === 'connection')?.[1];
      if (connectionHandler) {
        connectionHandler(mockSocket);
      }

      const subscribeHandler = (mockSocket.on as jest.MockedFunction<any>).mock.calls.find(
        (call: any) => call[0] === 'subscribe:submission'
      )?.[1];

      if (subscribeHandler) {
        await subscribeHandler({ submissionId: 'submission-789' });
      }

      expect(mockSocket.join).not.toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Unauthorized access to submission' });
    });

    it('should reject subscription without submissionId', async () => {
      const { initializeSubmissionSocketHandlers } = await import('../../src/services/submissionSocketService');
      initializeSubmissionSocketHandlers();

      const connectionHandler = mockIo.on.mock.calls.find((call: any) => call[0] === 'connection')?.[1];
      if (connectionHandler) {
        connectionHandler(mockSocket);
      }

      const subscribeHandler = (mockSocket.on as jest.MockedFunction<any>).mock.calls.find(
        (call: any) => call[0] === 'subscribe:submission'
      )?.[1];

      if (subscribeHandler) {
        await subscribeHandler({});
      }

      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Submission ID is required' });
    });
  });

  describe('unsubscribe:submission event', () => {
    it('should allow user to unsubscribe from submission', async () => {
      const { initializeSubmissionSocketHandlers } = await import('../../src/services/submissionSocketService');
      initializeSubmissionSocketHandlers();

      const connectionHandler = mockIo.on.mock.calls.find((call: any) => call[0] === 'connection')?.[1];
      if (connectionHandler) {
        connectionHandler(mockSocket);
      }

      const unsubscribeHandler = (mockSocket.on as jest.MockedFunction<any>).mock.calls.find(
        (call: any) => call[0] === 'unsubscribe:submission'
      )?.[1];

      if (unsubscribeHandler) {
        unsubscribeHandler({ submissionId: 'submission-123' });
      }

      expect(mockSocket.leave).toHaveBeenCalledWith('submission:submission-123');
      expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribed:submission', { submissionId: 'submission-123' });
    });
  });

  describe('emitSubmissionUpdate', () => {
    it('should emit status update to submission room', async () => {
      const { emitSubmissionUpdate } = await import('../../src/services/submissionSocketService');

      emitSubmissionUpdate('submission-123', 'COMPILING');

      expect(mockIo.to).toHaveBeenCalledWith('submission:submission-123');
      expect(mockIo.emit).toHaveBeenCalledWith('submission:update', {
        submissionId: 'submission-123',
        status: 'COMPILING',
        timestamp: expect.any(String),
      });
    });

    it('should emit status update with progress information', async () => {
      const { emitSubmissionUpdate } = await import('../../src/services/submissionSocketService');

      emitSubmissionUpdate('submission-123', 'RUNNING', { current: 3, total: 10 });

      expect(mockIo.to).toHaveBeenCalledWith('submission:submission-123');
      expect(mockIo.emit).toHaveBeenCalledWith('submission:update', {
        submissionId: 'submission-123',
        status: 'RUNNING',
        progress: { current: 3, total: 10 },
        timestamp: expect.any(String),
      });
    });
  });

  describe('emitSubmissionComplete', () => {
    it('should emit completion event with full results', async () => {
      const { emitSubmissionComplete } = await import('../../src/services/submissionSocketService');

      const testCaseResults = [
        { testCaseId: 'tc-1', status: 'ACCEPTED', executionTime: 100, memoryUsed: 1024 },
        { testCaseId: 'tc-2', status: 'ACCEPTED', executionTime: 150, memoryUsed: 2048 },
      ];

      emitSubmissionComplete('submission-123', 'ACCEPTED', 125, 2048, testCaseResults);

      expect(mockIo.to).toHaveBeenCalledWith('submission:submission-123');
      expect(mockIo.emit).toHaveBeenCalledWith('submission:complete', {
        submissionId: 'submission-123',
        verdict: 'ACCEPTED',
        executionTime: 125,
        memoryUsed: 2048,
        testCaseResults,
        timestamp: expect.any(String),
      });
    });
  });
});
