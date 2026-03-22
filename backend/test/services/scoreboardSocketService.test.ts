import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Socket } from 'socket.io';

/**
 * Scoreboard Socket Service Tests
 * Tests scoreboard-specific WebSocket events and freeze time logic
 * Validates: REQ-11.6, REQ-12.3
 */

// Mock dependencies
jest.mock('../../src/../src/services/socketService');
jest.mock('../../src/../src/services/scoreboardService');
jest.mock('../../src/utils/logger');
jest.mock('../../src/utils/prisma', () => ({
  __esModule: true,
  default: {
    contest: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Scoreboard Socket Service', () => {
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
      in: jest.fn().mockReturnThis(),
      fetchSockets: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
      emit: jest.fn(),
    };

    const { getSocketServer } = require('./socketService');
    (getSocketServer as jest.MockedFunction<typeof getSocketServer>).mockReturnValue(mockIo);
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe('initializeScoreboardSocketHandlers', () => {
    it('should register connection handler', async () => {
      const { initializeScoreboardSocketHandlers } = await import('../../src/services/scoreboardSocketService');

      initializeScoreboardSocketHandlers();

      expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });
  });

  describe('subscribe:scoreboard event', () => {
    it('should allow user to subscribe to contest scoreboard', async () => {
      const prisma = (await import('../../src/utils/prisma')).default;
      (prisma.contest.findUnique as jest.MockedFunction<any>).mockResolvedValue({
        id: 'contest-123',
      });

      const { initializeScoreboardSocketHandlers } = await import('../../src/services/scoreboardSocketService');
      initializeScoreboardSocketHandlers();

      const connectionHandler = mockIo.on.mock.calls.find((call: any) => call[0] === 'connection')?.[1];
      if (connectionHandler) {
        connectionHandler(mockSocket);
      }

      const subscribeHandler = (mockSocket.on as jest.MockedFunction<any>).mock.calls.find(
        (call: any) => call[0] === 'subscribe:scoreboard'
      )?.[1];

      if (subscribeHandler) {
        await subscribeHandler({ contestId: 'contest-123' });
      }

      expect(mockSocket.join).toHaveBeenCalledWith('scoreboard:contest-123');
      expect(mockSocket.emit).toHaveBeenCalledWith('subscribed:scoreboard', { contestId: 'contest-123' });
    });

    it('should reject subscription to non-existent contest', async () => {
      const prisma = (await import('../../src/utils/prisma')).default;
      (prisma.contest.findUnique as jest.MockedFunction<any>).mockResolvedValue(null);

      const { initializeScoreboardSocketHandlers } = await import('../../src/services/scoreboardSocketService');
      initializeScoreboardSocketHandlers();

      const connectionHandler = mockIo.on.mock.calls.find((call: any) => call[0] === 'connection')?.[1];
      if (connectionHandler) {
        connectionHandler(mockSocket);
      }

      const subscribeHandler = (mockSocket.on as jest.MockedFunction<any>).mock.calls.find(
        (call: any) => call[0] === 'subscribe:scoreboard'
      )?.[1];

      if (subscribeHandler) {
        await subscribeHandler({ contestId: 'invalid-contest' });
      }

      expect(mockSocket.join).not.toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Contest not found' });
    });

    it('should reject subscription without contestId', async () => {
      const { initializeScoreboardSocketHandlers } = await import('../../src/services/scoreboardSocketService');
      initializeScoreboardSocketHandlers();

      const connectionHandler = mockIo.on.mock.calls.find((call: any) => call[0] === 'connection')?.[1];
      if (connectionHandler) {
        connectionHandler(mockSocket);
      }

      const subscribeHandler = (mockSocket.on as jest.MockedFunction<any>).mock.calls.find(
        (call: any) => call[0] === 'subscribe:scoreboard'
      )?.[1];

      if (subscribeHandler) {
        await subscribeHandler({});
      }

      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Contest ID is required' });
    });
  });

  describe('unsubscribe:scoreboard event', () => {
    it('should allow user to unsubscribe from scoreboard', async () => {
      const { initializeScoreboardSocketHandlers } = await import('../../src/services/scoreboardSocketService');
      initializeScoreboardSocketHandlers();

      const connectionHandler = mockIo.on.mock.calls.find((call: any) => call[0] === 'connection')?.[1];
      if (connectionHandler) {
        connectionHandler(mockSocket);
      }

      const unsubscribeHandler = (mockSocket.on as jest.MockedFunction<any>).mock.calls.find(
        (call: any) => call[0] === 'unsubscribe:scoreboard'
      )?.[1];

      if (unsubscribeHandler) {
        unsubscribeHandler({ contestId: 'contest-123' });
      }

      expect(mockSocket.leave).toHaveBeenCalledWith('scoreboard:contest-123');
      expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribed:scoreboard', { contestId: 'contest-123' });
    });
  });

  describe('emitScoreboardUpdate', () => {
    it('should emit scoreboard update to all users when not in freeze period', async () => {
      const prisma = (await import('../../src/utils/prisma')).default;
      const now = new Date();
      const contestEndTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

      (prisma.contest.findUnique as jest.MockedFunction<any>).mockResolvedValue({
        id: 'contest-123',
        startTime: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
        endTime: contestEndTime,
        freezeTime: 30, // 30 minutes before end
      });

      const mockUserSocket = {
        id: 'user-socket',
        data: { userId: 'user-123', role: 'user' },
        emit: jest.fn(),
      };

      mockIo.in.mockReturnValue({
        fetchSockets: jest.fn<() => Promise<any[]>>().mockResolvedValue([mockUserSocket]),
      });

      const { generateScoreboard } = require('./scoreboardService');
      (generateScoreboard as jest.MockedFunction<any>).mockResolvedValue({
        participants: [],
        isFrozen: false,
      });

      const { emitScoreboardUpdate } = await import('../../src/services/scoreboardSocketService');
      await emitScoreboardUpdate('contest-123');

      expect(mockUserSocket.emit).toHaveBeenCalledWith('scoreboard:update', {
        contestId: 'contest-123',
        scoreboard: {
          participants: [],
          isFrozen: false,
        },
        timestamp: expect.any(String),
      });
    });

    it('should emit frozen scoreboard to contestants during freeze period', async () => {
      const prisma = (await import('../../src/utils/prisma')).default;
      const now = new Date();
      const contestEndTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now

      (prisma.contest.findUnique as jest.MockedFunction<any>).mockResolvedValue({
        id: 'contest-123',
        startTime: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
        endTime: contestEndTime,
        freezeTime: 30, // 30 minutes before end (we're in freeze period)
      });

      const mockUserSocket = {
        id: 'user-socket',
        data: { userId: 'user-123', role: 'user' },
        emit: jest.fn(),
      };

      mockIo.in.mockReturnValue({
        fetchSockets: jest.fn<() => Promise<any[]>>().mockResolvedValue([mockUserSocket]),
      });

      const { generateScoreboard } = require('./scoreboardService');
      (generateScoreboard as jest.MockedFunction<any>).mockResolvedValue({
        participants: [],
        isFrozen: true,
      });

      const { emitScoreboardUpdate } = await import('../../src/services/scoreboardSocketService');
      await emitScoreboardUpdate('contest-123');

      expect(generateScoreboard).toHaveBeenCalledWith('contest-123', false);
      expect(mockUserSocket.emit).toHaveBeenCalledWith('scoreboard:update', {
        contestId: 'contest-123',
        scoreboard: {
          participants: [],
          isFrozen: true,
        },
        timestamp: expect.any(String),
      });
    });

    it('should emit live scoreboard to admins during freeze period', async () => {
      const prisma = (await import('../../src/utils/prisma')).default;
      const now = new Date();
      const contestEndTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now

      (prisma.contest.findUnique as jest.MockedFunction<any>).mockResolvedValue({
        id: 'contest-123',
        startTime: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
        endTime: contestEndTime,
        freezeTime: 30, // 30 minutes before end (we're in freeze period)
      });

      const mockAdminSocket = {
        id: 'admin-socket',
        data: { userId: 'admin-123', role: 'admin' },
        emit: jest.fn(),
      };

      mockIo.in.mockReturnValue({
        fetchSockets: jest.fn<() => Promise<any[]>>().mockResolvedValue([mockAdminSocket]),
      });

      const { generateScoreboard } = require('./scoreboardService');
      (generateScoreboard as jest.MockedFunction<any>).mockResolvedValue({
        participants: [],
        isFrozen: false,
      });

      const { emitScoreboardUpdate } = await import('../../src/services/scoreboardSocketService');
      await emitScoreboardUpdate('contest-123');

      expect(generateScoreboard).toHaveBeenCalledWith('contest-123', true);
      expect(mockAdminSocket.emit).toHaveBeenCalledWith('scoreboard:update', {
        contestId: 'contest-123',
        scoreboard: {
          participants: [],
          isFrozen: false,
        },
        timestamp: expect.any(String),
      });
    });

    it('should handle non-existent contest gracefully', async () => {
      const prisma = (await import('../../src/utils/prisma')).default;
      (prisma.contest.findUnique as jest.MockedFunction<any>).mockResolvedValue(null);

      const { emitScoreboardUpdate } = await import('../../src/services/scoreboardSocketService');
      await emitScoreboardUpdate('invalid-contest');

      // Should not throw error, just log warning
      expect(mockIo.in).not.toHaveBeenCalled();
    });
  });
});
