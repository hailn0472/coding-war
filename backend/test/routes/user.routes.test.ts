import request from 'supertest';
import express, { Express } from 'express';
import userRoutes from '../../src/../src/routes/user.routes';
import { authenticate } from '../../src/../src/middleware/auth';
import { errorHandler } from '../../src/../src/middleware/errorHandler';
import * as userService from '../../src/../src/services/userService';
import { Role } from '@prisma/client';

// Mock dependencies
jest.mock('../../src/services/userService');
jest.mock('../../src/middleware/auth');
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    get: jest.fn(),
    setEx: jest.fn(),
    keys: jest.fn().mockResolvedValue([]),
    del: jest.fn(),
    on: jest.fn(),
  })),
}));

describe('User Routes', () => {
  let app: Express;

  const validUserId = '550e8400-e29b-41d4-a716-446655440000';
  const validOtherUserId = '550e8400-e29b-41d4-a716-446655440001';
  const validAdminId = '550e8400-e29b-41d4-a716-446655440002';

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/users', userRoutes);
    app.use(errorHandler);

    // Mock authenticate middleware
    (authenticate as jest.Mock).mockImplementation((req, _res, next) => {
      req.user = {
        userId: validUserId,
        role: 'USER' as Role,
      };
      next();
    });

    jest.clearAllMocks();
  });

  describe('GET /api/users/:id', () => {
    it('should return user profile with statistics', async () => {
      const mockProfile = {
        id: validUserId,
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
        createdAt: new Date('2024-01-01'),
        statistics: {
          totalSubmissions: 10,
          acceptedSubmissions: 5,
          solvedProblems: 3,
          contestsParticipated: 2,
        },
      };

      (userService.getUserProfile as jest.Mock).mockResolvedValue(mockProfile);

      const response = await request(app)
        .get(`/api/users/${validUserId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: mockProfile.id,
        username: mockProfile.username,
        email: mockProfile.email,
        role: mockProfile.role,
        statistics: mockProfile.statistics,
      });
      expect(userService.getUserProfile).toHaveBeenCalledWith(
        validUserId,
        validUserId,
        'USER'
      );
    });

    it('should return 400 for invalid user ID', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id')
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 when user not found', async () => {
      (userService.getUserProfile as jest.Mock).mockRejectedValue(
        new Error('User not found')
      );

      await request(app)
        .get('/api/users/00000000-0000-0000-0000-000000000000')
        .expect(500);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user email', async () => {
      const mockUpdatedUser = {
        id: validUserId,
        username: 'testuser',
        email: 'newemail@example.com',
        role: 'USER',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      (userService.updateUserProfile as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .put(`/api/users/${validUserId}`)
        .send({ email: 'newemail@example.com' })
        .expect(200);

      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.user).toMatchObject({
        id: mockUpdatedUser.id,
        username: mockUpdatedUser.username,
        email: mockUpdatedUser.email,
        role: mockUpdatedUser.role,
      });
      expect(userService.updateUserProfile).toHaveBeenCalledWith(
        validUserId,
        { email: 'newemail@example.com' },
        validUserId
      );
    });

    it('should update user password with current password', async () => {
      const mockUpdatedUser = {
        id: validUserId,
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      (userService.updateUserProfile as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .put(`/api/users/${validUserId}`)
        .send({
          currentPassword: 'OldPass123',
          newPassword: 'NewPass123',
        })
        .expect(200);

      expect(response.body.message).toBe('Profile updated successfully');
      expect(userService.updateUserProfile).toHaveBeenCalledWith(
        validUserId,
        {
          currentPassword: 'OldPass123',
          newPassword: 'NewPass123',
        },
        validUserId
      );
    });

    it('should return 400 when newPassword provided without currentPassword', async () => {
      const response = await request(app)
        .put(`/api/users/${validUserId}`)
        .send({ newPassword: 'NewPass123' })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 403 when user tries to update another user profile', async () => {
      const response = await request(app)
        .put(`/api/users/${validOtherUserId}`)
        .send({ email: 'newemail@example.com' })
        .expect(403);

      expect(response.body.code).toBe('FORBIDDEN');
    });

    it('should allow admin to update any user profile', async () => {
      // Mock admin user
      (authenticate as jest.Mock).mockImplementation((req, _res, next) => {
        req.user = {
          userId: validAdminId,
          role: 'ADMIN' as Role,
        };
        next();
      });

      const mockUpdatedUser = {
        id: validOtherUserId,
        username: 'otheruser',
        email: 'newemail@example.com',
        role: 'USER',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      (userService.updateUserProfile as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .put(`/api/users/${validOtherUserId}`)
        .send({ email: 'newemail@example.com' })
        .expect(200);

      expect(response.body.message).toBe('Profile updated successfully');
    });
  });

  describe('GET /api/users/:id/submissions', () => {
    it('should return paginated user submissions', async () => {
      const mockSubmissions = {
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
            submittedAt: new Date('2024-01-01'),
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
            submittedAt: new Date('2024-01-02'),
          },
        ],
        total: 2,
        page: 1,
        totalPages: 1,
      };

      (userService.getUserSubmissions as jest.Mock).mockResolvedValue(mockSubmissions);

      const response = await request(app)
        .get(`/api/users/${validUserId}/submissions`)
        .query({ page: 1, limit: 20 })
        .expect(200);

      expect(response.body.submissions).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.page).toBe(1);
      expect(response.body.totalPages).toBe(1);
      expect(userService.getUserSubmissions).toHaveBeenCalledWith(
        validUserId,
        { page: 1, limit: 20 },
        validUserId,
        'USER'
      );
    });

    it('should use default pagination values', async () => {
      const mockSubmissions = {
        submissions: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };

      (userService.getUserSubmissions as jest.Mock).mockResolvedValue(mockSubmissions);

      await request(app)
        .get(`/api/users/${validUserId}/submissions`)
        .expect(200);

      expect(userService.getUserSubmissions).toHaveBeenCalledWith(
        validUserId,
        { page: 1, limit: 20 },
        validUserId,
        'USER'
      );
    });

    it('should return 400 for invalid user ID', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id/submissions')
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 when user not found', async () => {
      (userService.getUserSubmissions as jest.Mock).mockRejectedValue(
        new Error('User not found')
      );

      await request(app)
        .get('/api/users/00000000-0000-0000-0000-000000000000/submissions')
        .expect(500);
    });
  });
});
