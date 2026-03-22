import {
  getUserProfile,
  updateUserProfile,
  getUserSubmissions,
} from '../../src/../src/services/userService';
import prisma from '../../src/../src/utils/prisma';
import { AppError } from '../../src/../src/middleware/errorHandler';
import * as authService from '../../src/../src/services/authService';
import { Role } from '@prisma/client';

// Mock dependencies
jest.mock('../../src/utils/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    submission: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../../src/../src/services/authService');

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should return user profile with statistics for own profile', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER' as Role,
        createdAt: new Date('2024-01-01'),
        isEmailVerified: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.submission.count as jest.Mock)
        .mockResolvedValueOnce(10) // totalSubmissions
        .mockResolvedValueOnce(5); // acceptedSubmissions
      (prisma.submission.findMany as jest.Mock)
        .mockResolvedValueOnce([
          { problemId: 'prob-1' },
          { problemId: 'prob-2' },
          { problemId: 'prob-3' },
        ]) // solvedProblems
        .mockResolvedValueOnce([
          { contestId: 'contest-1' },
          { contestId: 'contest-2' },
        ]); // contestsParticipated

      const result = await getUserProfile('user-123', 'user-123', 'USER' as Role);

      expect(result).toEqual({
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
        createdAt: mockUser.createdAt,
        statistics: {
          totalSubmissions: 10,
          acceptedSubmissions: 5,
          solvedProblems: 3,
          contestsParticipated: 2,
        },
      });
    });

    it('should hide email when viewing another user profile', async () => {
      const mockUser = {
        id: 'user-456',
        username: 'otheruser',
        email: 'other@example.com',
        role: 'USER' as Role,
        createdAt: new Date('2024-01-01'),
        isEmailVerified: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.submission.count as jest.Mock)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2);
      (prisma.submission.findMany as jest.Mock)
        .mockResolvedValueOnce([{ problemId: 'prob-1' }])
        .mockResolvedValueOnce([{ contestId: 'contest-1' }]);

      const result = await getUserProfile('user-456', 'user-123', 'USER' as Role);

      expect(result.email).toBeUndefined();
      expect(result.username).toBe('otheruser');
    });

    it('should show email when admin views any profile', async () => {
      const mockUser = {
        id: 'user-456',
        username: 'otheruser',
        email: 'other@example.com',
        role: 'USER' as Role,
        createdAt: new Date('2024-01-01'),
        isEmailVerified: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.submission.count as jest.Mock)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2);
      (prisma.submission.findMany as jest.Mock)
        .mockResolvedValueOnce([{ problemId: 'prob-1' }])
        .mockResolvedValueOnce([{ contestId: 'contest-1' }]);

      const result = await getUserProfile('user-456', 'admin-123', 'ADMIN' as Role);

      expect(result.email).toBe('other@example.com');
    });

    it('should throw error when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        getUserProfile('nonexistent', 'user-123', 'USER' as Role)
      ).rejects.toThrow(AppError);
    });
  });

  describe('updateUserProfile', () => {
    it('should update user email', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'old@example.com',
        passwordHash: 'hashedpassword',
        role: 'USER' as Role,
        createdAt: new Date('2024-01-01'),
      };

      const mockUpdatedUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'new@example.com',
        role: 'USER' as Role,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUser) // First call: get user
        .mockResolvedValueOnce(null); // Second call: check email uniqueness
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const result = await updateUserProfile(
        'user-123',
        { email: 'new@example.com' },
        'user-123'
      );

      expect(result.email).toBe('new@example.com');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          email: 'new@example.com',
          isEmailVerified: false,
        },
        select: expect.any(Object),
      });
    });

    it('should throw error when email already exists', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'old@example.com',
        passwordHash: 'hashedpassword',
      };

      const mockExistingUser = {
        id: 'user-456',
        email: 'existing@example.com',
      };

      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockExistingUser);

      await expect(
        updateUserProfile('user-123', { email: 'existing@example.com' }, 'user-123')
      ).rejects.toThrow(AppError);
    });

    it('should update password with valid current password', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'oldhashedpassword',
        role: 'USER' as Role,
        createdAt: new Date('2024-01-01'),
      };

      const mockUpdatedUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER' as Role,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (authService.verifyPassword as jest.Mock).mockResolvedValue(true);
      (authService.hashPassword as jest.Mock).mockResolvedValue('newhashedpassword');
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const result = await updateUserProfile(
        'user-123',
        {
          currentPassword: 'OldPass123',
          newPassword: 'NewPass123',
        },
        'user-123'
      );

      expect(authService.verifyPassword).toHaveBeenCalledWith(
        'OldPass123',
        'oldhashedpassword'
      );
      expect(authService.hashPassword).toHaveBeenCalledWith('NewPass123');
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should throw error when current password is invalid', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (authService.verifyPassword as jest.Mock).mockResolvedValue(false);

      await expect(
        updateUserProfile(
          'user-123',
          {
            currentPassword: 'WrongPass123',
            newPassword: 'NewPass123',
          },
          'user-123'
        )
      ).rejects.toThrow(AppError);
    });

    it('should throw error when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        updateUserProfile('nonexistent', { email: 'new@example.com' }, 'user-123')
      ).rejects.toThrow(AppError);
    });
  });

  describe('getUserSubmissions', () => {
    it('should return paginated user submissions', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
      };

      const mockSubmissions = [
        {
          id: 'sub-1',
          problemId: 'prob-1',
          problem: { title: 'Two Sum' },
          language: 'PYTHON',
          status: 'ACCEPTED',
          verdict: 'Accepted',
          executionTime: 100,
          memoryUsed: 10,
          submittedAt: new Date('2024-01-01'),
        },
        {
          id: 'sub-2',
          problemId: 'prob-2',
          problem: { title: 'Add Two Numbers' },
          language: 'CPP',
          status: 'WRONG_ANSWER',
          verdict: 'Wrong Answer',
          executionTime: 50,
          memoryUsed: 8,
          submittedAt: new Date('2024-01-02'),
        },
      ];

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.submission.findMany as jest.Mock).mockResolvedValue(mockSubmissions);
      (prisma.submission.count as jest.Mock).mockResolvedValue(2);

      const result = await getUserSubmissions(
        'user-123',
        { page: 1, limit: 20 },
        'user-123',
        'USER' as Role
      );

      expect(result).toEqual({
        submissions: [
          {
            id: 'sub-1',
            problemId: 'prob-1',
            problemTitle: 'Two Sum',
            language: 'PYTHON',
            status: 'ACCEPTED',
            verdict: 'Accepted',
            executionTime: 100,
            memoryUsed: 10,
            submittedAt: mockSubmissions[0].submittedAt,
          },
          {
            id: 'sub-2',
            problemId: 'prob-2',
            problemTitle: 'Add Two Numbers',
            language: 'CPP',
            status: 'WRONG_ANSWER',
            verdict: 'Wrong Answer',
            executionTime: 50,
            memoryUsed: 8,
            submittedAt: mockSubmissions[1].submittedAt,
          },
        ],
        total: 2,
        page: 1,
        totalPages: 1,
      });
    });

    it('should handle pagination correctly', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.submission.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.submission.count as jest.Mock).mockResolvedValue(50);

      const result = await getUserSubmissions(
        'user-123',
        { page: 2, limit: 20 },
        'user-123',
        'USER' as Role
      );

      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(3);
      expect(prisma.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        })
      );
    });

    it('should throw error when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        getUserSubmissions(
          'nonexistent',
          { page: 1, limit: 20 },
          'user-123',
          'USER' as Role
        )
      ).rejects.toThrow(AppError);
    });
  });
});
