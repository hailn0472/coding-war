import {
  getAllUsers,
  updateUserRole,
  getSystemStatistics,
} from '../../src/../src/services/adminService';
import prisma from '../../src/utils/prisma';
import { AppError } from '../../src/middleware/errorHandler';

// Mock Prisma
jest.mock('../../src/utils/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    submission: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    problem: {
      count: jest.fn(),
    },
    contest: {
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

describe('Admin Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return paginated list of users with statistics', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          username: 'testuser1',
          email: 'test1@example.com',
          role: 'USER',
          isEmailVerified: true,
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'user-2',
          username: 'testuser2',
          email: 'test2@example.com',
          role: 'ADMIN',
          isEmailVerified: false,
          createdAt: new Date('2024-01-02'),
        },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prisma.user.count as jest.Mock).mockResolvedValue(2);

      // Mock submission counts for user-1
      (prisma.submission.count as jest.Mock)
        .mockResolvedValueOnce(10) // totalSubmissions
        .mockResolvedValueOnce(5) // acceptedSubmissions
        .mockResolvedValueOnce(8) // totalSubmissions for user-2
        .mockResolvedValueOnce(3); // acceptedSubmissions for user-2

      // Mock solved problems for user-1
      (prisma.submission.findMany as jest.Mock)
        .mockResolvedValueOnce([
          { problemId: 'p1' },
          { problemId: 'p2' },
          { problemId: 'p3' },
        ]) // solvedProblems
        .mockResolvedValueOnce([
          { contestId: 'c1' },
          { contestId: 'c2' },
        ]) // contestsParticipated
        .mockResolvedValueOnce([
          { problemId: 'p1' },
          { problemId: 'p2' },
        ]) // solvedProblems for user-2
        .mockResolvedValueOnce([{ contestId: 'c1' }]); // contestsParticipated for user-2

      const result = await getAllUsers({
        page: 1,
        limit: 20,
      });

      expect(result.users).toHaveLength(2);
      expect(result.users[0]).toEqual({
        id: 'user-1',
        username: 'testuser1',
        email: 'test1@example.com',
        role: 'USER',
        isEmailVerified: true,
        createdAt: mockUsers[0].createdAt,
        statistics: {
          totalSubmissions: 10,
          acceptedSubmissions: 5,
          solvedProblems: 3,
          contestsParticipated: 2,
        },
      });
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should support search by username or email', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.count as jest.Mock).mockResolvedValue(0);

      await getAllUsers({
        page: 1,
        limit: 20,
        search: 'testuser',
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { username: { contains: 'testuser', mode: 'insensitive' } },
              { email: { contains: 'testuser', mode: 'insensitive' } },
            ],
          },
        })
      );
    });

    it('should support filtering by role', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.count as jest.Mock).mockResolvedValue(0);

      await getAllUsers({
        page: 1,
        limit: 20,
        role: 'ADMIN',
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            role: 'ADMIN',
          },
        })
      );
    });

    it('should handle pagination correctly', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.count as jest.Mock).mockResolvedValue(50);

      const result = await getAllUsers({
        page: 2,
        limit: 10,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
      expect(result.totalPages).toBe(5);
    });
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        role: 'ADMIN',
      });

      await updateUserRole('user-123', 'ADMIN');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { role: 'ADMIN' },
      });
    });

    it('should throw error for invalid role', async () => {
      await expect(updateUserRole('user-123', 'INVALID_ROLE')).rejects.toThrow(
        AppError
      );
      await expect(updateUserRole('user-123', 'INVALID_ROLE')).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_ROLE',
      });
    });

    it('should throw error when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(updateUserRole('user-123', 'ADMIN')).rejects.toThrow(AppError);
      await expect(updateUserRole('user-123', 'ADMIN')).rejects.toMatchObject({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    });

    it('should accept all valid roles', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      await updateUserRole('user-123', 'ADMIN');
      await updateUserRole('user-123', 'USER');
      await updateUserRole('user-123', 'GUEST');

      expect(prisma.user.update).toHaveBeenCalledTimes(3);
    });
  });

  describe('getSystemStatistics', () => {
    it('should return system-wide statistics', async () => {
      // Mock total counts
      (prisma.user.count as jest.Mock).mockResolvedValue(100);
      (prisma.problem.count as jest.Mock).mockResolvedValue(50);
      (prisma.submission.count as jest.Mock).mockResolvedValue(1000);
      (prisma.contest.count as jest.Mock).mockResolvedValue(10);

      // Mock recent activity data
      const mockSubmissionsPerDay = [
        { date: new Date('2024-03-01'), count: BigInt(20) },
        { date: new Date('2024-03-02'), count: BigInt(25) },
      ];
      const mockNewUsersPerDay = [
        { date: new Date('2024-03-01'), count: BigInt(5) },
        { date: new Date('2024-03-02'), count: BigInt(3) },
      ];

      (prisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce(mockSubmissionsPerDay)
        .mockResolvedValueOnce(mockNewUsersPerDay);

      const result = await getSystemStatistics();

      expect(result.totalUsers).toBe(100);
      expect(result.totalProblems).toBe(50);
      expect(result.totalSubmissions).toBe(1000);
      expect(result.totalContests).toBe(10);
      expect(result.recentActivity).toHaveLength(30); // Last 30 days
      expect(result.recentActivity[0]).toHaveProperty('date');
      expect(result.recentActivity[0]).toHaveProperty('submissions');
      expect(result.recentActivity[0]).toHaveProperty('newUsers');
    });

    it('should fill in missing days with zero activity', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(10);
      (prisma.problem.count as jest.Mock).mockResolvedValue(5);
      (prisma.submission.count as jest.Mock).mockResolvedValue(100);
      (prisma.contest.count as jest.Mock).mockResolvedValue(2);

      // Only one day has activity
      const mockSubmissionsPerDay = [
        { date: new Date('2024-03-01'), count: BigInt(20) },
      ];
      const mockNewUsersPerDay = [
        { date: new Date('2024-03-01'), count: BigInt(5) },
      ];

      (prisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce(mockSubmissionsPerDay)
        .mockResolvedValueOnce(mockNewUsersPerDay);

      const result = await getSystemStatistics();

      // Should have 30 days of data
      expect(result.recentActivity).toHaveLength(30);

      // Most days should have 0 activity
      const zeroDays = result.recentActivity.filter(
        (day) => day.submissions === 0 && day.newUsers === 0
      );
      expect(zeroDays.length).toBeGreaterThan(25);
    });

    it('should order recent activity by date ascending', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(10);
      (prisma.problem.count as jest.Mock).mockResolvedValue(5);
      (prisma.submission.count as jest.Mock).mockResolvedValue(100);
      (prisma.contest.count as jest.Mock).mockResolvedValue(2);

      (prisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await getSystemStatistics();

      // Check that dates are in ascending order
      for (let i = 1; i < result.recentActivity.length; i++) {
        const prevDate = new Date(result.recentActivity[i - 1].date);
        const currDate = new Date(result.recentActivity[i].date);
        expect(currDate.getTime()).toBeGreaterThan(prevDate.getTime());
      }
    });
  });
});
