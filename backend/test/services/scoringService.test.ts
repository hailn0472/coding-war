import {
  calculateIOIScore,
  calculateACMScore,
  calculateScore,
  calculateContestScores,
} from '../../src/../src/services/scoringService';
import prisma from '../../src/../src/utils/prisma';
import { ScoringRule, SubmissionStatus } from '@prisma/client';

// Mock prisma
jest.mock('../../src/utils/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
    contest: {
      findUnique: jest.fn(),
    },
    contestProblem: {
      findMany: jest.fn(),
    },
    submission: {
      findMany: jest.fn(),
    },
    contestParticipant: {
      findMany: jest.fn(),
    },
  },
}));

describe('Scoring Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateIOIScore', () => {
    const contestId = 'contest-1';
    const userId = 'user-1';
    const username = 'testuser';

    it('should calculate IOI score with full points for accepted submissions', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ username });

      (prisma.contestProblem.findMany as jest.Mock).mockResolvedValue([
        {
          problemId: 'problem-1',
          points: 100,
          problem: {
            testCases: [{ id: 'tc-1' }, { id: 'tc-2' }],
          },
        },
        {
          problemId: 'problem-2',
          points: 200,
          problem: {
            testCases: [{ id: 'tc-3' }, { id: 'tc-4' }],
          },
        },
      ]);

      (prisma.submission.findMany as jest.Mock)
        .mockResolvedValueOnce([
          {
            id: 'sub-1',
            status: SubmissionStatus.ACCEPTED,
            submittedAt: new Date('2024-01-01T10:30:00Z'),
            testCaseResults: [],
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'sub-2',
            status: SubmissionStatus.ACCEPTED,
            submittedAt: new Date('2024-01-01T11:00:00Z'),
            testCaseResults: [],
          },
        ]);

      const result = await calculateIOIScore(contestId, userId);

      expect(result.userId).toBe(userId);
      expect(result.username).toBe(username);
      expect(result.totalScore).toBe(300); // 100 + 200
      expect(result.solvedCount).toBe(2);
      expect(result.penaltyTime).toBe(0);
      expect(result.problems).toHaveLength(2);
      expect(result.problems[0].score).toBe(100);
      expect(result.problems[1].score).toBe(200);
    });

    it('should calculate partial score based on passed test cases', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ username });

      (prisma.contestProblem.findMany as jest.Mock).mockResolvedValue([
        {
          problemId: 'problem-1',
          points: 100,
          problem: {
            testCases: [{ id: 'tc-1' }, { id: 'tc-2' }, { id: 'tc-3' }, { id: 'tc-4' }],
          },
        },
      ]);

      (prisma.submission.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'sub-1',
          status: SubmissionStatus.WRONG_ANSWER,
          submittedAt: new Date('2024-01-01T10:30:00Z'),
          testCaseResults: [
            { status: SubmissionStatus.ACCEPTED },
            { status: SubmissionStatus.ACCEPTED },
            { status: SubmissionStatus.WRONG_ANSWER },
            { status: SubmissionStatus.WRONG_ANSWER },
          ],
        },
      ]);

      const result = await calculateIOIScore(contestId, userId);

      expect(result.totalScore).toBe(50); // 2/4 test cases passed = 50% of 100 points
      expect(result.solvedCount).toBe(1); // Partial score counts as solved
      expect(result.problems[0].score).toBe(50);
    });

    it('should use best score from multiple submissions', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ username });

      (prisma.contestProblem.findMany as jest.Mock).mockResolvedValue([
        {
          problemId: 'problem-1',
          points: 100,
          problem: {
            testCases: [{ id: 'tc-1' }, { id: 'tc-2' }],
          },
        },
      ]);

      (prisma.submission.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'sub-1',
          status: SubmissionStatus.WRONG_ANSWER,
          submittedAt: new Date('2024-01-01T10:00:00Z'),
          testCaseResults: [
            { status: SubmissionStatus.ACCEPTED },
            { status: SubmissionStatus.WRONG_ANSWER },
          ],
        },
        {
          id: 'sub-2',
          status: SubmissionStatus.ACCEPTED,
          submittedAt: new Date('2024-01-01T10:30:00Z'),
          testCaseResults: [],
        },
        {
          id: 'sub-3',
          status: SubmissionStatus.WRONG_ANSWER,
          submittedAt: new Date('2024-01-01T11:00:00Z'),
          testCaseResults: [
            { status: SubmissionStatus.WRONG_ANSWER },
            { status: SubmissionStatus.WRONG_ANSWER },
          ],
        },
      ]);

      const result = await calculateIOIScore(contestId, userId);

      expect(result.totalScore).toBe(100); // Best submission is accepted
      expect(result.problems[0].score).toBe(100);
      expect(result.problems[0].attempts).toBe(3);
    });

    it('should handle zero score for unsolved problems', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ username });

      (prisma.contestProblem.findMany as jest.Mock).mockResolvedValue([
        {
          problemId: 'problem-1',
          points: 100,
          problem: {
            testCases: [{ id: 'tc-1' }, { id: 'tc-2' }],
          },
        },
      ]);

      (prisma.submission.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'sub-1',
          status: SubmissionStatus.WRONG_ANSWER,
          submittedAt: new Date('2024-01-01T10:00:00Z'),
          testCaseResults: [
            { status: SubmissionStatus.WRONG_ANSWER },
            { status: SubmissionStatus.WRONG_ANSWER },
          ],
        },
      ]);

      const result = await calculateIOIScore(contestId, userId);

      expect(result.totalScore).toBe(0);
      expect(result.solvedCount).toBe(0);
      expect(result.problems[0].score).toBe(0);
    });

    it('should handle problems with no submissions', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ username });

      (prisma.contestProblem.findMany as jest.Mock).mockResolvedValue([
        {
          problemId: 'problem-1',
          points: 100,
          problem: {
            testCases: [{ id: 'tc-1' }],
          },
        },
      ]);

      (prisma.submission.findMany as jest.Mock).mockResolvedValue([]);

      const result = await calculateIOIScore(contestId, userId);

      expect(result.totalScore).toBe(0);
      expect(result.solvedCount).toBe(0);
      expect(result.problems[0].score).toBe(0);
      expect(result.problems[0].attempts).toBe(0);
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(calculateIOIScore(contestId, userId)).rejects.toThrow('User not found');
    });
  });

  describe('calculateACMScore', () => {
    const contestId = 'contest-1';
    const userId = 'user-1';
    const username = 'testuser';
    const contestStartTime = new Date('2024-01-01T10:00:00Z');

    it('should calculate ACM score with accepted problems and penalty time', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ username });
      (prisma.contest.findUnique as jest.Mock).mockResolvedValue({ startTime: contestStartTime });

      (prisma.contestProblem.findMany as jest.Mock).mockResolvedValue([
        { problemId: 'problem-1' },
        { problemId: 'problem-2' },
      ]);

      // Problem 1: Accepted after 30 minutes with 1 wrong attempt
      (prisma.submission.findMany as jest.Mock)
        .mockResolvedValueOnce([
          {
            id: 'sub-1',
            status: SubmissionStatus.WRONG_ANSWER,
            submittedAt: new Date('2024-01-01T10:15:00Z'),
            contestRelativeTime: null,
          },
          {
            id: 'sub-2',
            status: SubmissionStatus.ACCEPTED,
            submittedAt: new Date('2024-01-01T10:30:00Z'),
            contestRelativeTime: 30, // Stored relative time
          },
        ])
        // Problem 2: Accepted after 60 minutes with no wrong attempts
        .mockResolvedValueOnce([
          {
            id: 'sub-3',
            status: SubmissionStatus.ACCEPTED,
            submittedAt: new Date('2024-01-01T11:00:00Z'),
            contestRelativeTime: 60, // Stored relative time
          },
        ]);

      const result = await calculateACMScore(contestId, userId);

      expect(result.userId).toBe(userId);
      expect(result.username).toBe(username);
      expect(result.totalScore).toBe(2); // 2 problems solved
      expect(result.solvedCount).toBe(2);
      // Problem 1: 30 minutes + (1 * 20) = 50 minutes
      // Problem 2: 60 minutes + (0 * 20) = 60 minutes
      // Total: 110 minutes
      expect(result.penaltyTime).toBe(110);
      expect(result.problems[0].score).toBe(1);
      expect(result.problems[0].penaltyMinutes).toBe(50);
      expect(result.problems[1].score).toBe(1);
      expect(result.problems[1].penaltyMinutes).toBe(60);
    });

    it('should not count penalty for unsolved problems', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ username });
      (prisma.contest.findUnique as jest.Mock).mockResolvedValue({ startTime: contestStartTime });

      (prisma.contestProblem.findMany as jest.Mock).mockResolvedValue([
        { problemId: 'problem-1' },
        { problemId: 'problem-2' },
      ]);

      // Problem 1: Accepted
      (prisma.submission.findMany as jest.Mock)
        .mockResolvedValueOnce([
          {
            id: 'sub-1',
            status: SubmissionStatus.ACCEPTED,
            submittedAt: new Date('2024-01-01T10:30:00Z'),
          },
        ])
        // Problem 2: Multiple wrong attempts, never accepted
        .mockResolvedValueOnce([
          {
            id: 'sub-2',
            status: SubmissionStatus.WRONG_ANSWER,
            submittedAt: new Date('2024-01-01T10:15:00Z'),
          },
          {
            id: 'sub-3',
            status: SubmissionStatus.WRONG_ANSWER,
            submittedAt: new Date('2024-01-01T10:45:00Z'),
          },
        ]);

      const result = await calculateACMScore(contestId, userId);

      expect(result.totalScore).toBe(1); // Only 1 problem solved
      expect(result.solvedCount).toBe(1);
      expect(result.penaltyTime).toBe(30); // Only penalty from solved problem
      expect(result.problems[0].score).toBe(1);
      expect(result.problems[1].score).toBe(0);
      expect(result.problems[1].penaltyMinutes).toBe(0);
    });

    it('should stop counting wrong attempts after first acceptance', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ username });
      (prisma.contest.findUnique as jest.Mock).mockResolvedValue({ startTime: contestStartTime });

      (prisma.contestProblem.findMany as jest.Mock).mockResolvedValue([
        { problemId: 'problem-1' },
      ]);

      (prisma.submission.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'sub-1',
          status: SubmissionStatus.WRONG_ANSWER,
          submittedAt: new Date('2024-01-01T10:10:00Z'),
        },
        {
          id: 'sub-2',
          status: SubmissionStatus.WRONG_ANSWER,
          submittedAt: new Date('2024-01-01T10:20:00Z'),
        },
        {
          id: 'sub-3',
          status: SubmissionStatus.ACCEPTED,
          submittedAt: new Date('2024-01-01T10:30:00Z'),
        },
        {
          id: 'sub-4',
          status: SubmissionStatus.WRONG_ANSWER,
          submittedAt: new Date('2024-01-01T10:40:00Z'),
        },
      ]);

      const result = await calculateACMScore(contestId, userId);

      expect(result.totalScore).toBe(1);
      expect(result.solvedCount).toBe(1);
      // 30 minutes + (2 wrong attempts * 20) = 70 minutes
      // The 4th submission after acceptance should not count
      expect(result.penaltyTime).toBe(70);
      expect(result.problems[0].attempts).toBe(4);
    });

    it('should handle problems with no submissions', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ username });
      (prisma.contest.findUnique as jest.Mock).mockResolvedValue({ startTime: contestStartTime });

      (prisma.contestProblem.findMany as jest.Mock).mockResolvedValue([
        { problemId: 'problem-1' },
      ]);

      (prisma.submission.findMany as jest.Mock).mockResolvedValue([]);

      const result = await calculateACMScore(contestId, userId);

      expect(result.totalScore).toBe(0);
      expect(result.solvedCount).toBe(0);
      expect(result.penaltyTime).toBe(0);
      expect(result.problems[0].score).toBe(0);
      expect(result.problems[0].attempts).toBe(0);
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(calculateACMScore(contestId, userId)).rejects.toThrow('User not found');
    });

    it('should throw error if contest not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ username });
      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(calculateACMScore(contestId, userId)).rejects.toThrow('Contest not found');
    });

    it('should use stored contestRelativeTime when available', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ username });
      (prisma.contest.findUnique as jest.Mock).mockResolvedValue({ startTime: contestStartTime });

      (prisma.contestProblem.findMany as jest.Mock).mockResolvedValue([
        { problemId: 'problem-1' },
      ]);

      // Submission with stored contestRelativeTime
      (prisma.submission.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'sub-1',
          status: SubmissionStatus.ACCEPTED,
          submittedAt: new Date('2024-01-01T10:45:00Z'), // 45 minutes from start
          contestRelativeTime: 30, // But stored time is 30 minutes (should use this)
        },
      ]);

      const result = await calculateACMScore(contestId, userId);

      // Should use stored contestRelativeTime (30) not calculated time (45)
      expect(result.penaltyTime).toBe(30);
      expect(result.problems[0].penaltyMinutes).toBe(30);
    });

    it('should fallback to calculated time when contestRelativeTime is null', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ username });
      (prisma.contest.findUnique as jest.Mock).mockResolvedValue({ startTime: contestStartTime });

      (prisma.contestProblem.findMany as jest.Mock).mockResolvedValue([
        { problemId: 'problem-1' },
      ]);

      // Legacy submission without contestRelativeTime
      (prisma.submission.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'sub-1',
          status: SubmissionStatus.ACCEPTED,
          submittedAt: new Date('2024-01-01T10:45:00Z'), // 45 minutes from start
          contestRelativeTime: null, // No stored time
        },
      ]);

      const result = await calculateACMScore(contestId, userId);

      // Should calculate from submittedAt (45 minutes)
      expect(result.penaltyTime).toBe(45);
      expect(result.problems[0].penaltyMinutes).toBe(45);
    });
  });

  describe('calculateScore', () => {
    const contestId = 'contest-1';
    const userId = 'user-1';

    it('should call calculateIOIScore for IOI contests', async () => {
      (prisma.contest.findUnique as jest.Mock).mockResolvedValue({
        scoringRule: ScoringRule.IOI,
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ username: 'testuser' });
      (prisma.contestProblem.findMany as jest.Mock).mockResolvedValue([]);

      const result = await calculateScore(contestId, userId);

      expect(result.penaltyTime).toBe(0); // IOI doesn't use penalty time
    });

    it('should call calculateACMScore for ACM contests', async () => {
      (prisma.contest.findUnique as jest.Mock).mockResolvedValue({
        scoringRule: ScoringRule.ACM,
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ username: 'testuser' });
      (prisma.contest.findUnique as jest.Mock).mockResolvedValue({
        scoringRule: ScoringRule.ACM,
        startTime: new Date(),
      });
      (prisma.contestProblem.findMany as jest.Mock).mockResolvedValue([]);

      const result = await calculateScore(contestId, userId);

      expect(result).toBeDefined();
    });

    it('should throw error if contest not found', async () => {
      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(calculateScore(contestId, userId)).rejects.toThrow('Contest not found');
    });
  });

  describe('calculateContestScores', () => {
    const contestId = 'contest-1';

    it('should calculate scores for all participants and sort by IOI rules', async () => {
      (prisma.contestParticipant.findMany as jest.Mock).mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
        { userId: 'user-3' },
      ]);

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue({
        scoringRule: ScoringRule.IOI,
      });

      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ username: 'user1' })
        .mockResolvedValueOnce({ username: 'user2' })
        .mockResolvedValueOnce({ username: 'user3' });

      (prisma.contestProblem.findMany as jest.Mock).mockResolvedValue([
        {
          problemId: 'problem-1',
          points: 100,
          problem: { testCases: [{ id: 'tc-1' }] },
        },
      ]);

      (prisma.submission.findMany as jest.Mock)
        .mockResolvedValueOnce([
          {
            status: SubmissionStatus.ACCEPTED,
            submittedAt: new Date(),
            testCaseResults: [],
          },
        ])
        .mockResolvedValueOnce([
          {
            status: SubmissionStatus.WRONG_ANSWER,
            submittedAt: new Date(),
            testCaseResults: [{ status: SubmissionStatus.ACCEPTED }],
          },
        ])
        .mockResolvedValueOnce([]);

      const result = await calculateContestScores(contestId);

      expect(result).toHaveLength(3);
      // Should be sorted by total score descending
      expect(result[0].totalScore).toBeGreaterThanOrEqual(result[1].totalScore);
      expect(result[1].totalScore).toBeGreaterThanOrEqual(result[2].totalScore);
    });

    it('should calculate scores for all participants and sort by ACM rules', async () => {
      (prisma.contestParticipant.findMany as jest.Mock).mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
      ]);

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue({
        scoringRule: ScoringRule.ACM,
        startTime: new Date('2024-01-01T10:00:00Z'),
      });

      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ username: 'user1' })
        .mockResolvedValueOnce({ username: 'user2' });

      (prisma.contestProblem.findMany as jest.Mock).mockResolvedValue([
        { problemId: 'problem-1' },
      ]);

      // User 1: Solved with 30 min penalty
      (prisma.submission.findMany as jest.Mock)
        .mockResolvedValueOnce([
          {
            status: SubmissionStatus.ACCEPTED,
            submittedAt: new Date('2024-01-01T10:30:00Z'),
          },
        ])
        // User 2: Solved with 60 min penalty
        .mockResolvedValueOnce([
          {
            status: SubmissionStatus.ACCEPTED,
            submittedAt: new Date('2024-01-01T11:00:00Z'),
          },
        ]);

      const result = await calculateContestScores(contestId);

      expect(result).toHaveLength(2);
      // Both solved 1 problem, so sort by penalty time (ascending)
      expect(result[0].penaltyTime).toBeLessThan(result[1].penaltyTime);
    });

    it('should handle empty participant list', async () => {
      (prisma.contestParticipant.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.contest.findUnique as jest.Mock).mockResolvedValue({
        scoringRule: ScoringRule.IOI,
      });

      const result = await calculateContestScores(contestId);

      expect(result).toHaveLength(0);
    });

    it('should throw error if contest not found', async () => {
      (prisma.contestParticipant.findMany as jest.Mock).mockResolvedValue([
        { userId: 'user-1' },
      ]);
      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(calculateContestScores(contestId)).rejects.toThrow('Contest not found');
    });
  });
});
