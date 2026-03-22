import {
  createContest,
  updateContest,
  deleteContest,
  getContestById,
  listContests,
  generateSlug,
  registerForContest,
  canViewContestProblems,
  canSubmitToContest,
} from '../../src/../src/services/contestService';
import prisma from '../../src/../src/utils/prisma';
import { ScoringRule, Visibility } from '@prisma/client';

// Mock prisma
jest.mock('../../src/utils/prisma', () => ({
  __esModule: true,
  default: {
    contest: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    contestParticipant: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe('Contest Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSlug', () => {
    it('should generate a URL-friendly slug from title', () => {
      expect(generateSlug('Summer Contest 2024')).toBe('summer-contest-2024');
      expect(generateSlug('ACM-ICPC Regional')).toBe('acm-icpc-regional');
      expect(generateSlug('Contest with Special!@# Characters')).toBe('contest-with-special-characters');
    });

    it('should handle multiple spaces and hyphens', () => {
      expect(generateSlug('Contest   with    spaces')).toBe('contest-with-spaces');
      expect(generateSlug('Contest---with---hyphens')).toBe('contest-with-hyphens');
    });

    it('should trim and lowercase', () => {
      expect(generateSlug('  UPPERCASE CONTEST  ')).toBe('uppercase-contest');
    });
  });

  describe('createContest', () => {
    it('should create a contest with all fields', async () => {
      const mockContest = {
        id: 'contest-1',
        title: 'Summer Contest',
        slug: 'summer-contest',
        description: 'A summer programming contest',
        startTime: new Date('2024-06-01T10:00:00Z'),
        endTime: new Date('2024-06-01T15:00:00Z'),
        freezeTime: 60,
        scoringRule: ScoringRule.IOI,
        visibility: Visibility.PUBLIC,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.contest.create as jest.Mock).mockResolvedValue(mockContest);

      const result = await createContest({
        title: 'Summer Contest',
        description: 'A summer programming contest',
        startTime: new Date('2024-06-01T10:00:00Z'),
        endTime: new Date('2024-06-01T15:00:00Z'),
        freezeTime: 60,
        scoringRule: ScoringRule.IOI,
        visibility: Visibility.PUBLIC,
      });

      expect(result).toEqual(mockContest);
      expect(prisma.contest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Summer Contest',
          slug: 'summer-contest',
          description: 'A summer programming contest',
          scoringRule: ScoringRule.IOI,
          visibility: Visibility.PUBLIC,
        }),
      });
    });

    it('should generate unique slug if slug already exists', async () => {
      const mockContest = {
        id: 'contest-2',
        title: 'Summer Contest',
        slug: 'summer-contest-1',
        description: 'Another summer contest',
        startTime: new Date('2024-07-01T10:00:00Z'),
        endTime: new Date('2024-07-01T15:00:00Z'),
        freezeTime: null,
        scoringRule: ScoringRule.ACM,
        visibility: Visibility.PUBLIC,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // First call returns existing contest, second call returns null
      (prisma.contest.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 'existing' })
        .mockResolvedValueOnce(null);
      (prisma.contest.create as jest.Mock).mockResolvedValue(mockContest);

      const result = await createContest({
        title: 'Summer Contest',
        description: 'Another summer contest',
        startTime: new Date('2024-07-01T10:00:00Z'),
        endTime: new Date('2024-07-01T15:00:00Z'),
        scoringRule: ScoringRule.ACM,
        visibility: Visibility.PUBLIC,
      });

      expect(result.slug).toBe('summer-contest-1');
    });
  });

  describe('updateContest', () => {
    it('should update contest with partial data', async () => {
      const mockUpdatedContest = {
        id: 'contest-1',
        title: 'Updated Contest',
        slug: 'updated-contest',
        description: 'Updated description',
        startTime: new Date('2024-06-01T10:00:00Z'),
        endTime: new Date('2024-06-01T15:00:00Z'),
        freezeTime: 30,
        scoringRule: ScoringRule.IOI,
        visibility: Visibility.PRIVATE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.contest.update as jest.Mock).mockResolvedValue(mockUpdatedContest);

      const result = await updateContest('contest-1', {
        title: 'Updated Contest',
        description: 'Updated description',
        visibility: Visibility.PRIVATE,
      });

      expect(result).toEqual(mockUpdatedContest);
      expect(prisma.contest.update).toHaveBeenCalledWith({
        where: { id: 'contest-1' },
        data: expect.objectContaining({
          title: 'Updated Contest',
          slug: 'updated-contest',
          description: 'Updated description',
          visibility: Visibility.PRIVATE,
        }),
      });
    });

    it('should update without regenerating slug if title not changed', async () => {
      const mockUpdatedContest = {
        id: 'contest-1',
        title: 'Original Contest',
        slug: 'original-contest',
        description: 'New description',
        startTime: new Date('2024-06-01T10:00:00Z'),
        endTime: new Date('2024-06-01T15:00:00Z'),
        freezeTime: 45,
        scoringRule: ScoringRule.ACM,
        visibility: Visibility.PUBLIC,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.contest.update as jest.Mock).mockResolvedValue(mockUpdatedContest);

      const result = await updateContest('contest-1', {
        description: 'New description',
        freezeTime: 45,
      });

      expect(result).toEqual(mockUpdatedContest);
      expect(prisma.contest.update).toHaveBeenCalledWith({
        where: { id: 'contest-1' },
        data: {
          description: 'New description',
          freezeTime: 45,
        },
      });
    });
  });

  describe('deleteContest', () => {
    it('should delete contest with cascade deletion', async () => {
      const mockDeletedContest = {
        id: 'contest-1',
        title: 'Contest to Delete',
        slug: 'contest-to-delete',
        description: 'This will be deleted',
        startTime: new Date('2024-06-01T10:00:00Z'),
        endTime: new Date('2024-06-01T15:00:00Z'),
        freezeTime: null,
        scoringRule: ScoringRule.IOI,
        visibility: Visibility.PUBLIC,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.contest.delete as jest.Mock).mockResolvedValue(mockDeletedContest);

      const result = await deleteContest('contest-1');

      expect(result).toEqual(mockDeletedContest);
      expect(prisma.contest.delete).toHaveBeenCalledWith({
        where: { id: 'contest-1' },
      });
    });
  });

  describe('getContestById', () => {
    it('should return contest with problems and participant count', async () => {
      const mockContest = {
        id: 'contest-1',
        title: 'Test Contest',
        slug: 'test-contest',
        description: 'A test contest',
        startTime: new Date('2024-06-01T10:00:00Z'),
        endTime: new Date('2024-06-01T15:00:00Z'),
        freezeTime: 60,
        scoringRule: ScoringRule.IOI,
        visibility: Visibility.PUBLIC,
        createdAt: new Date(),
        updatedAt: new Date(),
        problems: [
          {
            id: 'cp-1',
            contestId: 'contest-1',
            problemId: 'problem-1',
            orderIndex: 0,
            points: 100,
            problem: {
              id: 'problem-1',
              title: 'Problem A',
              difficulty: 'EASY',
            },
          },
        ],
        _count: {
          participants: 42,
        },
      };

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);

      const result = await getContestById('contest-1');

      expect(result).toEqual({
        ...mockContest,
        participantCount: 42,
        _count: undefined,
      });
      expect(prisma.contest.findUnique).toHaveBeenCalledWith({
        where: { id: 'contest-1' },
        include: {
          problems: {
            include: {
              problem: {
                select: {
                  id: true,
                  title: true,
                  difficulty: true,
                },
              },
            },
            orderBy: {
              orderIndex: 'asc',
            },
          },
          _count: {
            select: {
              participants: true,
            },
          },
        },
      });
    });

    it('should return null if contest not found', async () => {
      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getContestById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('listContests', () => {
    it('should list all contests with pagination', async () => {
      const mockContests = [
        {
          id: 'contest-1',
          title: 'Contest 1',
          slug: 'contest-1',
          description: 'First contest',
          startTime: new Date('2024-06-01T10:00:00Z'),
          endTime: new Date('2024-06-01T15:00:00Z'),
          freezeTime: null,
          scoringRule: ScoringRule.IOI,
          visibility: Visibility.PUBLIC,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { participants: 10 },
        },
        {
          id: 'contest-2',
          title: 'Contest 2',
          slug: 'contest-2',
          description: 'Second contest',
          startTime: new Date('2024-07-01T10:00:00Z'),
          endTime: new Date('2024-07-01T15:00:00Z'),
          freezeTime: 30,
          scoringRule: ScoringRule.ACM,
          visibility: Visibility.PUBLIC,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { participants: 20 },
        },
      ];

      (prisma.contest.findMany as jest.Mock).mockResolvedValue(mockContests);
      (prisma.contest.count as jest.Mock).mockResolvedValue(2);

      const result = await listContests({ page: 1, limit: 20 });

      expect(result.contests).toHaveLength(2);
      expect(result.contests[0].participantCount).toBe(10);
      expect(result.contests[1].participantCount).toBe(20);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter upcoming contests', async () => {
      const mockContests = [
        {
          id: 'contest-1',
          title: 'Upcoming Contest',
          slug: 'upcoming-contest',
          description: 'Future contest',
          startTime: new Date('2025-06-01T10:00:00Z'),
          endTime: new Date('2025-06-01T15:00:00Z'),
          freezeTime: null,
          scoringRule: ScoringRule.IOI,
          visibility: Visibility.PUBLIC,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { participants: 5 },
        },
      ];

      (prisma.contest.findMany as jest.Mock).mockResolvedValue(mockContests);
      (prisma.contest.count as jest.Mock).mockResolvedValue(1);

      const result = await listContests({ status: 'upcoming' });

      expect(result.contests).toHaveLength(1);
      expect(prisma.contest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startTime: expect.objectContaining({
              gt: expect.any(Date),
            }),
          }),
        })
      );
    });

    it('should filter ongoing contests', async () => {
      const mockContests = [
        {
          id: 'contest-1',
          title: 'Ongoing Contest',
          slug: 'ongoing-contest',
          description: 'Current contest',
          startTime: new Date('2024-01-01T10:00:00Z'),
          endTime: new Date('2025-12-31T15:00:00Z'),
          freezeTime: null,
          scoringRule: ScoringRule.ACM,
          visibility: Visibility.PUBLIC,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { participants: 15 },
        },
      ];

      (prisma.contest.findMany as jest.Mock).mockResolvedValue(mockContests);
      (prisma.contest.count as jest.Mock).mockResolvedValue(1);

      const result = await listContests({ status: 'ongoing' });

      expect(result.contests).toHaveLength(1);
      expect(prisma.contest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.any(Array),
          }),
        })
      );
    });

    it('should filter ended contests', async () => {
      const mockContests = [
        {
          id: 'contest-1',
          title: 'Ended Contest',
          slug: 'ended-contest',
          description: 'Past contest',
          startTime: new Date('2023-01-01T10:00:00Z'),
          endTime: new Date('2023-01-01T15:00:00Z'),
          freezeTime: null,
          scoringRule: ScoringRule.IOI,
          visibility: Visibility.PUBLIC,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { participants: 25 },
        },
      ];

      (prisma.contest.findMany as jest.Mock).mockResolvedValue(mockContests);
      (prisma.contest.count as jest.Mock).mockResolvedValue(1);

      const result = await listContests({ status: 'ended' });

      expect(result.contests).toHaveLength(1);
      expect(prisma.contest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            endTime: expect.objectContaining({
              lt: expect.any(Date),
            }),
          }),
        })
      );
    });
  });

  describe('registerForContest', () => {
    // Use dates relative to now to avoid time-based test failures
    const now = new Date();
    const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day in future
    const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day in past
    const userId = 'user-123';
    const contestId = 'contest-1';

    it('should successfully register user for public contest before start time', async () => {
      const mockContest = {
        id: contestId,
        visibility: Visibility.PUBLIC,
        startTime: futureDate,
      };

      const mockParticipant = {
        id: 'participant-1',
        contestId,
        userId,
        registeredAt: new Date(),
      };

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);
      (prisma.contestParticipant.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.contestParticipant.create as jest.Mock).mockResolvedValue(mockParticipant);

      const result = await registerForContest(contestId, userId);

      expect(result).toEqual(mockParticipant);
      expect(prisma.contestParticipant.create).toHaveBeenCalledWith({
        data: {
          contestId,
          userId,
        },
      });
    });

    it('should throw error if contest not found', async () => {
      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(registerForContest(contestId, userId)).rejects.toThrow('Contest not found');
    });

    it('should throw error if contest has already started', async () => {
      const mockContest = {
        id: contestId,
        visibility: Visibility.PUBLIC,
        startTime: pastDate,
      };

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);

      await expect(registerForContest(contestId, userId)).rejects.toThrow(
        'Cannot register after contest has started'
      );
    });

    it('should throw error for private contests', async () => {
      const mockContest = {
        id: contestId,
        visibility: Visibility.PRIVATE,
        startTime: futureDate,
      };

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);

      await expect(registerForContest(contestId, userId)).rejects.toThrow(
        'This is a private contest. Registration requires invitation.'
      );
    });

    it('should throw error if user is already registered', async () => {
      const mockContest = {
        id: contestId,
        visibility: Visibility.PUBLIC,
        startTime: futureDate,
      };

      const existingParticipant = {
        id: 'participant-1',
        contestId,
        userId,
        registeredAt: new Date(),
      };

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);
      (prisma.contestParticipant.findUnique as jest.Mock).mockResolvedValue(existingParticipant);

      await expect(registerForContest(contestId, userId)).rejects.toThrow(
        'User is already registered for this contest'
      );
    });

    it('should allow registration for CONTEST_ONLY visibility', async () => {
      const mockContest = {
        id: contestId,
        visibility: Visibility.CONTEST_ONLY,
        startTime: futureDate,
      };

      const mockParticipant = {
        id: 'participant-1',
        contestId,
        userId,
        registeredAt: new Date(),
      };

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);
      (prisma.contestParticipant.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.contestParticipant.create as jest.Mock).mockResolvedValue(mockParticipant);

      const result = await registerForContest(contestId, userId);

      expect(result).toEqual(mockParticipant);
    });
  });

  describe('canViewContestProblems', () => {
    const userId = 'user-123';
    const contestId = 'contest-1';
    const now = new Date();
    const pastDate = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
    const futureDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

    it('should return true if user is registered and contest has started', async () => {
      const mockContest = {
        id: contestId,
        startTime: pastDate,
      };

      const mockParticipant = {
        id: 'participant-1',
        contestId,
        userId,
        registeredAt: new Date(),
      };

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);
      (prisma.contestParticipant.findUnique as jest.Mock).mockResolvedValue(mockParticipant);

      const result = await canViewContestProblems(contestId, userId);

      expect(result).toBe(true);
    });

    it('should return false if contest not found', async () => {
      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await canViewContestProblems(contestId, userId);

      expect(result).toBe(false);
    });

    it('should return false if contest has not started yet', async () => {
      const mockContest = {
        id: contestId,
        startTime: futureDate,
      };

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);

      const result = await canViewContestProblems(contestId, userId);

      expect(result).toBe(false);
    });

    it('should return false if user is not registered', async () => {
      const mockContest = {
        id: contestId,
        startTime: pastDate,
      };

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);
      (prisma.contestParticipant.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await canViewContestProblems(contestId, userId);

      expect(result).toBe(false);
    });

    it('should return true if user is registered and contest has started (even if ended)', async () => {
      const mockContest = {
        id: contestId,
        startTime: pastDate,
      };

      const mockParticipant = {
        id: 'participant-1',
        contestId,
        userId,
        registeredAt: new Date(),
      };

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);
      (prisma.contestParticipant.findUnique as jest.Mock).mockResolvedValue(mockParticipant);

      const result = await canViewContestProblems(contestId, userId);

      expect(result).toBe(true);
    });
  });

  describe('canSubmitToContest', () => {
    const userId = 'user-123';
    const contestId = 'contest-1';
    const now = new Date();
    const pastStartDate = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
    const futureStartDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const futureEndDate = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours from now
    const pastEndDate = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

    it('should return true if user is registered and contest is ongoing', async () => {
      const mockContest = {
        id: contestId,
        startTime: pastStartDate,
        endTime: futureEndDate,
      };

      const mockParticipant = {
        id: 'participant-1',
        contestId,
        userId,
        registeredAt: new Date(),
      };

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);
      (prisma.contestParticipant.findUnique as jest.Mock).mockResolvedValue(mockParticipant);

      const result = await canSubmitToContest(contestId, userId);

      expect(result).toBe(true);
    });

    it('should return false if contest not found', async () => {
      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await canSubmitToContest(contestId, userId);

      expect(result).toBe(false);
    });

    it('should return false if contest has not started yet', async () => {
      const mockContest = {
        id: contestId,
        startTime: futureStartDate,
        endTime: futureEndDate,
      };

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);

      const result = await canSubmitToContest(contestId, userId);

      expect(result).toBe(false);
    });

    it('should return false if contest has ended', async () => {
      const mockContest = {
        id: contestId,
        startTime: pastStartDate,
        endTime: pastEndDate,
      };

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);

      const result = await canSubmitToContest(contestId, userId);

      expect(result).toBe(false);
    });

    it('should return false if user is not registered', async () => {
      const mockContest = {
        id: contestId,
        startTime: pastStartDate,
        endTime: futureEndDate,
      };

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);
      (prisma.contestParticipant.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await canSubmitToContest(contestId, userId);

      expect(result).toBe(false);
    });

    it('should return false if user is registered but contest has not started', async () => {
      const mockContest = {
        id: contestId,
        startTime: futureStartDate,
        endTime: futureEndDate,
      };

      const mockParticipant = {
        id: 'participant-1',
        contestId,
        userId,
        registeredAt: new Date(),
      };

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);
      (prisma.contestParticipant.findUnique as jest.Mock).mockResolvedValue(mockParticipant);

      const result = await canSubmitToContest(contestId, userId);

      expect(result).toBe(false);
    });

    it('should return false if user is registered but contest has ended', async () => {
      const mockContest = {
        id: contestId,
        startTime: pastStartDate,
        endTime: pastEndDate,
      };

      const mockParticipant = {
        id: 'participant-1',
        contestId,
        userId,
        registeredAt: new Date(),
      };

      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);
      (prisma.contestParticipant.findUnique as jest.Mock).mockResolvedValue(mockParticipant);

      const result = await canSubmitToContest(contestId, userId);

      expect(result).toBe(false);
    });
  });
});
