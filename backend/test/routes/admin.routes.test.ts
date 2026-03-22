import request from 'supertest';
import express, { Express } from 'express';
import adminRoutes from '../../src/../src/routes/admin.routes';
import { errorHandler, AppError } from '../../src/middleware/errorHandler';
import * as adminService from '../../src/services/adminService';
import * as submissionService from '../../src/services/submissionService';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('../../src/services/adminService');
jest.mock('../../src/services/submissionService');
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    setEx: jest.fn().mockResolvedValue('OK'),
    keys: jest.fn().mockResolvedValue([]),
    del: jest.fn().mockResolvedValue(1),
    on: jest.fn(),
  })),
}));

describe('Admin Routes', () => {
  let app: Express;
  let adminToken: string;
  let userToken: string;

  beforeAll(() => {
    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/api/admin', adminRoutes);
    app.use(errorHandler);

    // Generate test tokens
    const secret = process.env.JWT_SECRET || 'test-secret';
    adminToken = jwt.sign(
      { userId: 'admin-id', role: 'ADMIN' },
      secret,
      { expiresIn: '1h' }
    );
    userToken = jwt.sign(
      { userId: 'user-id', role: 'USER' },
      secret,
      { expiresIn: '1h' }
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/users', () => {
    it('should return paginated list of users for admin', async () => {
      const mockUsers = {
        users: [
          {
            id: 'user-1',
            username: 'testuser1',
            email: 'test1@example.com',
            role: 'USER',
            isEmailVerified: true,
            createdAt: new Date('2024-01-01'),
            statistics: {
              totalSubmissions: 10,
              acceptedSubmissions: 5,
              solvedProblems: 3,
              contestsParticipated: 2,
            },
          },
          {
            id: 'user-2',
            username: 'testuser2',
            email: 'test2@example.com',
            role: 'USER',
            isEmailVerified: false,
            createdAt: new Date('2024-01-02'),
            statistics: {
              totalSubmissions: 5,
              acceptedSubmissions: 2,
              solvedProblems: 1,
              contestsParticipated: 0,
            },
          },
        ],
        total: 2,
        page: 1,
        totalPages: 1,
      };

      (adminService.getAllUsers as jest.Mock).mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body.users).toHaveLength(2);
      expect(response.body.users[0].username).toBe('testuser1');
      expect(response.body.users[0].email).toBe('test1@example.com');
      expect(response.body.users[0].statistics.totalSubmissions).toBe(10);
      expect(response.body.total).toBe(2);
      expect(response.body.page).toBe(1);
      expect(response.body.totalPages).toBe(1);
      expect(adminService.getAllUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        search: undefined,
        role: undefined,
      });
    });

    it('should support search by username or email', async () => {
      const mockUsers = {
        users: [
          {
            id: 'user-1',
            username: 'testuser',
            email: 'test@example.com',
            role: 'USER',
            isEmailVerified: true,
            createdAt: new Date('2024-01-01'),
            statistics: {
              totalSubmissions: 10,
              acceptedSubmissions: 5,
              solvedProblems: 3,
              contestsParticipated: 2,
            },
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      (adminService.getAllUsers as jest.Mock).mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 20, search: 'testuser' });

      expect(response.status).toBe(200);
      expect(adminService.getAllUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        search: 'testuser',
        role: undefined,
      });
    });

    it('should support filtering by role', async () => {
      const mockUsers = {
        users: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };

      (adminService.getAllUsers as jest.Mock).mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 20, role: 'ADMIN' });

      expect(response.status).toBe(200);
      expect(adminService.getAllUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        search: undefined,
        role: 'ADMIN',
      });
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(adminService.getAllUsers).not.toHaveBeenCalled();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/admin/users');

      expect(response.status).toBe(401);
      expect(adminService.getAllUsers).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid query parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 0, limit: 200 });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/admin/users/:id/role', () => {
    it('should update user role for admin', async () => {
      (adminService.updateUserRole as jest.Mock).mockResolvedValue(undefined);

      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .put(`/api/admin/users/${validUuid}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'ADMIN' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User role updated successfully');
      expect(adminService.updateUserRole).toHaveBeenCalledWith(validUuid, 'ADMIN');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .put('/api/admin/users/user-123/role')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'ADMIN' });

      expect(response.status).toBe(403);
      expect(adminService.updateUserRole).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid role', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .put(`/api/admin/users/${validUuid}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'INVALID_ROLE' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid user ID', async () => {
      const response = await request(app)
        .put('/api/admin/users/invalid-id/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'USER' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/admin/statistics', () => {
    it('should return system statistics for admin', async () => {
      const mockStats = {
        totalUsers: 100,
        totalProblems: 50,
        totalSubmissions: 1000,
        totalContests: 10,
        recentActivity: [
          { date: '2024-03-01', submissions: 20, newUsers: 5 },
          { date: '2024-03-02', submissions: 25, newUsers: 3 },
        ],
      };

      (adminService.getSystemStatistics as jest.Mock).mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/admin/statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStats);
      expect(adminService.getSystemStatistics).toHaveBeenCalled();
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/admin/statistics')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(adminService.getSystemStatistics).not.toHaveBeenCalled();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/admin/statistics');

      expect(response.status).toBe(401);
      expect(adminService.getSystemStatistics).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/admin/submissions/:id/rejudge', () => {
    it('should rejudge submission for admin', async () => {
      (submissionService.rejudgeSubmission as jest.Mock).mockResolvedValue(undefined);

      const submissionId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .post(`/api/admin/submissions/${submissionId}/rejudge`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Submission requeued for judging');
      expect(submissionService.rejudgeSubmission).toHaveBeenCalledWith(submissionId);
    });

    it('should return 403 for non-admin users', async () => {
      const submissionId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .post(`/api/admin/submissions/${submissionId}/rejudge`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(submissionService.rejudgeSubmission).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid submission ID', async () => {
      const response = await request(app)
        .post('/api/admin/submissions/invalid-id/rejudge')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('should return 404 when submission not found', async () => {
      const submissionId = '123e4567-e89b-12d3-a456-426614174000';
      const error = new AppError(404, 'SUBMISSION_NOT_FOUND', 'Submission not found');
      (submissionService.rejudgeSubmission as jest.Mock).mockRejectedValue(error);

      const response = await request(app)
        .post(`/api/admin/submissions/${submissionId}/rejudge`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });
});
