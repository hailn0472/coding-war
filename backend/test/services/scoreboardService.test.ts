import { generateScoreboard, invalidateScoreboardCache } from '../../src/../src/services/scoreboardService';
import * as scoringService from '../../src/../src/services/scoringService';
import prisma from '../../src/utils/prisma';

// Mock dependencies
jest.mock('../../src/utils/prisma', () => ({
  __esModule: true,
  default: {
    contest: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../../src/../src/services/scoringService', () => ({
  calculateContestScores: jest.fn(),
}));

jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    setEx: jest.fn().mockResolvedValue('OK'),
    keys: jest.fn().mockResolvedValue([]),
    del: jest.fn().mockResolvedValue(1),
  })),
}));

describe('Scoreboard Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateScoreboard', () => {
    it('should generate scoreboard with ranks for IOI contest', async () => {
      const contestId = 'contest-1';
      const mockContest = {
        id: contestId,
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T12:00:00Z'),
        freezeTime: null,
      };

      const mockScores = [
        {
          userId: 'user-1',
          username: 'alice',
          totalScore: 300,
          solvedCount: 3,
          penaltyTime: 0,
          problems: [],
        },
        {
          userId: 'user-2',
          username: 'bob',
          totalScore: 200,
          solvedCount: 2,
          penaltyTime: 0,
          problems: [],
        },
        {
          userId: 'user-3',
          username: 'charlie',
          totalScore: 100,
          solvedCount: 1,
          penaltyTime: 0,
          problems: [],
        },
      ];

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);
      (scoringService.calculateContestScores as jest.Mock).mockResolvedValue(mockScores);

      const scoreboard = await generateScoreboard(contestId, false);

      expect(scoreboard.participants).toHaveLength(3);
      expect(scoreboard.participants[0].rank).toBe(1);
      expect(scoreboard.participants[0].username).toBe('alice');
      expect(scoreboard.participants[1].rank).toBe(2);
      expect(scoreboard.participants[1].username).toBe('bob');
      expect(scoreboard.participants[2].rank).toBe(3);
      expect(scoreboard.participants[2].username).toBe('charlie');
      expect(scoreboard.isFrozen).toBe(false);
    });

    it('should handle ties correctly (same rank for same score)', async () => {
      const contestId = 'contest-1';
      const mockContest = {
        id: contestId,
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T12:00:00Z'),
        freezeTime: null,
      };

      const mockScores = [
        {
          userId: 'user-1',
          username: 'alice',
          totalScore: 300,
          solvedCount: 3,
          penaltyTime: 0,
          problems: [],
        },
        {
          userId: 'user-2',
          username: 'bob',
          totalScore: 300,
          solvedCount: 3,
          penaltyTime: 0,
          problems: [],
        },
        {
          userId: 'user-3',
          username: 'charlie',
          totalScore: 100,
          solvedCount: 1,
          penaltyTime: 0,
          problems: [],
        },
      ];

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);
      (scoringService.calculateContestScores as jest.Mock).mockResolvedValue(mockScores);

      const scoreboard = await generateScoreboard(contestId, false);

      expect(scoreboard.participants).toHaveLength(3);
      expect(scoreboard.participants[0].rank).toBe(1);
      expect(scoreboard.participants[1].rank).toBe(1); // Same rank as first
      expect(scoreboard.participants[2].rank).toBe(3); // Rank jumps to 3
    });

    it('should handle ACM scoring with penalty time', async () => {
      const contestId = 'contest-1';
      const mockContest = {
        id: contestId,
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T12:00:00Z'),
        freezeTime: null,
      };

      const mockScores = [
        {
          userId: 'user-1',
          username: 'alice',
          totalScore: 3,
          solvedCount: 3,
          penaltyTime: 100,
          problems: [],
        },
        {
          userId: 'user-2',
          username: 'bob',
          totalScore: 3,
          solvedCount: 3,
          penaltyTime: 150, // Same solved count but higher penalty
          problems: [],
        },
        {
          userId: 'user-3',
          username: 'charlie',
          totalScore: 2,
          solvedCount: 2,
          penaltyTime: 50,
          problems: [],
        },
      ];

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);
      (scoringService.calculateContestScores as jest.Mock).mockResolvedValue(mockScores);

      const scoreboard = await generateScoreboard(contestId, false);

      expect(scoreboard.participants).toHaveLength(3);
      expect(scoreboard.participants[0].rank).toBe(1);
      expect(scoreboard.participants[0].username).toBe('alice');
      expect(scoreboard.participants[1].rank).toBe(2); // Different penalty, different rank
      expect(scoreboard.participants[1].username).toBe('bob');
      expect(scoreboard.participants[2].rank).toBe(3);
    });

    it('should set isFrozen to true during freeze period for non-admin', async () => {
      const contestId = 'contest-1';
      const now = new Date();
      const endTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now
      const startTime = new Date(now.getTime() - 50 * 60 * 1000); // 50 minutes ago
      
      const mockContest = {
        id: contestId,
        startTime,
        endTime,
        freezeTime: 30, // Freeze 30 minutes before end
      };

      const mockScores = [
        {
          userId: 'user-1',
          username: 'alice',
          totalScore: 300,
          solvedCount: 3,
          penaltyTime: 0,
          problems: [],
        },
      ];

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);
      (scoringService.calculateContestScores as jest.Mock).mockResolvedValue(mockScores);

      const scoreboard = await generateScoreboard(contestId, false);

      expect(scoreboard.isFrozen).toBe(true);
      expect(scoreboard.freezeTime).toBeDefined();
    });

    it('should set isFrozen to false for admin during freeze period', async () => {
      const contestId = 'contest-1';
      const now = new Date();
      const endTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now
      const startTime = new Date(now.getTime() - 50 * 60 * 1000); // 50 minutes ago
      
      const mockContest = {
        id: contestId,
        startTime,
        endTime,
        freezeTime: 30, // Freeze 30 minutes before end
      };

      const mockScores = [
        {
          userId: 'user-1',
          username: 'alice',
          totalScore: 300,
          solvedCount: 3,
          penaltyTime: 0,
          problems: [],
        },
      ];

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);
      (scoringService.calculateContestScores as jest.Mock).mockResolvedValue(mockScores);

      const scoreboard = await generateScoreboard(contestId, true); // isAdmin = true

      expect(scoreboard.isFrozen).toBe(false); // Admin sees live scoreboard
    });

    it('should set isFrozen to false when no freeze time configured', async () => {
      const contestId = 'contest-1';
      const now = new Date();
      const endTime = new Date(now.getTime() + 10 * 60 * 1000);
      const startTime = new Date(now.getTime() - 50 * 60 * 1000);
      
      const mockContest = {
        id: contestId,
        startTime,
        endTime,
        freezeTime: null, // No freeze
      };

      const mockScores = [
        {
          userId: 'user-1',
          username: 'alice',
          totalScore: 300,
          solvedCount: 3,
          penaltyTime: 0,
          problems: [],
        },
      ];

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);
      (scoringService.calculateContestScores as jest.Mock).mockResolvedValue(mockScores);

      const scoreboard = await generateScoreboard(contestId, false);

      expect(scoreboard.isFrozen).toBe(false);
      expect(scoreboard.freezeTime).toBeUndefined();
    });

    it('should set isFrozen to false before freeze period starts', async () => {
      const contestId = 'contest-1';
      const now = new Date();
      const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 60 minutes from now
      const startTime = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago
      
      const mockContest = {
        id: contestId,
        startTime,
        endTime,
        freezeTime: 30, // Freeze 30 minutes before end (not yet reached)
      };

      const mockScores = [
        {
          userId: 'user-1',
          username: 'alice',
          totalScore: 300,
          solvedCount: 3,
          penaltyTime: 0,
          problems: [],
        },
      ];

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);
      (scoringService.calculateContestScores as jest.Mock).mockResolvedValue(mockScores);

      const scoreboard = await generateScoreboard(contestId, false);

      expect(scoreboard.isFrozen).toBe(false);
    });

    it('should set isFrozen to false after contest ends', async () => {
      const contestId = 'contest-1';
      const now = new Date();
      const endTime = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago (ended)
      const startTime = new Date(now.getTime() - 70 * 60 * 1000); // 70 minutes ago
      
      const mockContest = {
        id: contestId,
        startTime,
        endTime,
        freezeTime: 30, // Freeze 30 minutes before end
      };

      const mockScores = [
        {
          userId: 'user-1',
          username: 'alice',
          totalScore: 300,
          solvedCount: 3,
          penaltyTime: 0,
          problems: [],
        },
      ];

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);
      (scoringService.calculateContestScores as jest.Mock).mockResolvedValue(mockScores);

      const scoreboard = await generateScoreboard(contestId, false);

      expect(scoreboard.isFrozen).toBe(false); // Contest ended, no freeze
    });

    it('should throw error if contest not found', async () => {
      const contestId = 'nonexistent';

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(generateScoreboard(contestId, false)).rejects.toThrow('Contest not found');
    });

    it('should handle empty participant list', async () => {
      const contestId = 'contest-1';
      const mockContest = {
        id: contestId,
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T12:00:00Z'),
        freezeTime: null,
      };

      const mockScores: any[] = [];

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);
      (scoringService.calculateContestScores as jest.Mock).mockResolvedValue(mockScores);

      const scoreboard = await generateScoreboard(contestId, false);

      expect(scoreboard.participants).toHaveLength(0);
      expect(scoreboard.isFrozen).toBe(false);
    });
  });

  describe('invalidateScoreboardCache', () => {
    it('should invalidate scoreboard cache for a contest', async () => {
      const contestId = 'contest-1';

      await invalidateScoreboardCache(contestId);

      // Test passes if no error is thrown
      expect(true).toBe(true);
    });
  });
});
