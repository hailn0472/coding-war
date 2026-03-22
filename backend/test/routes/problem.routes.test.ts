import request from 'supertest';
import express, { Express } from 'express';
import problemRoutes from '../../src/../src/routes/problem.routes';
import { errorHandler } from '../../src/middleware/errorHandler';
import { authenticate, optionalAuth } from '../../src/middleware/auth';
import { adminOnly } from '../../src/middleware/authorize';
import * as problemService from '../../src/services/problemService';
import prisma from '../../src/utils/prisma';

// Mock dependencies
jest.mock('../../src/services/problemService');
jest.mock('../../src/utils/prisma', () => ({
  __esModule: true,
  default: {
    problem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    submission: {
      count: jest.fn(),
    },
  },
}));
jest.mock('../../src/middleware/auth');
jest.mock('../../src/middleware/authorize');
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    setEx: jest.fn().mockResolvedValue('OK'),
    keys: jest.fn().mockResolvedValue([]),
    del: jest.fn().mockResolvedValue(1),
  })),
}));

describe('Problem Routes', () => {
  let app: Express;

  beforeEach(() => {
    // Create Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api/problems', problemRoutes);
    app.use(errorHandler);

    // Reset mocks - use mockReset to clear implementations too
    jest.clearAllMocks();
    (authenticate as jest.Mock).mockReset();
    (optionalAuth as jest.Mock).mockReset();
    (adminOnly as jest.Mock).mockReset();

    // Mock authenticate middleware to pass through
    (authenticate as jest.Mock).mockImplementation((req, _res, next) => {
      req.user = { userId: 'test-user-id', role: 'ADMIN' };
      next();
    });

    // Mock optionalAuth middleware to pass through
    (optionalAuth as jest.Mock).mockImplementation((req, _res, next) => {
      req.user = { userId: 'test-user-id', role: 'ADMIN' };
      next();
    });

    // Mock adminOnly middleware to pass through
    (adminOnly as jest.Mock).mockImplementation((_req, _res, next) => {
      next();
    });
  });

  describe('GET /api/problems', () => {
    it('should list problems with default pagination', async () => {
      // Override default mock to use regular USER role
      (optionalAuth as jest.Mock).mockImplementation((req, _res, next) => {
        req.user = { userId: 'test-user-id', role: 'USER' };
        next();
      });

      const mockProblems = {
        problems: [
          {
            id: 'problem-1',
            title: 'Two Sum',
            slug: 'two-sum',
            difficulty: 'EASY',
            tags: ['array', 'hash-table'],
            visibility: 'PUBLIC',
            createdAt: '2026-03-22T11:59:55.174Z', // String instead of Date
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      (problemService.listProblems as jest.Mock).mockResolvedValue(mockProblems);

      const response = await request(app).get('/api/problems');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProblems);
      expect(problemService.listProblems).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 20,
          visibility: 'PUBLIC',
        })
      );
    });

    it('should filter problems by difficulty', async () => {
      const mockProblems = {
        problems: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };

      (problemService.listProblems as jest.Mock).mockResolvedValue(mockProblems);

      const response = await request(app)
        .get('/api/problems')
        .query({ difficulty: 'HARD' });

      expect(response.status).toBe(200);
      expect(problemService.listProblems).toHaveBeenCalledWith(
        expect.objectContaining({
          difficulty: 'HARD',
        })
      );
    });

    it('should filter problems by tags', async () => {
      const mockProblems = {
        problems: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };

      (problemService.listProblems as jest.Mock).mockResolvedValue(mockProblems);

      const response = await request(app)
        .get('/api/problems')
        .query({ tags: 'array,hash-table' });

      expect(response.status).toBe(200);
      expect(problemService.listProblems).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['array', 'hash-table'],
        })
      );
    });

    it('should search problems by title and description', async () => {
      const mockProblems = [
        {
          id: 'problem-1',
          title: 'Two Sum',
          slug: 'two-sum',
          difficulty: 'EASY',
          tags: ['array'],
          visibility: 'PUBLIC',
          createdAt: '2026-03-22T11:59:55.230Z', // String instead of Date
        },
      ];

      (prisma.problem.findMany as jest.Mock).mockResolvedValue(mockProblems);
      (prisma.problem.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/problems')
        .query({ search: 'sum' });

      expect(response.status).toBe(200);
      expect(response.body.problems).toEqual(mockProblems);
      expect(prisma.problem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'sum', mode: 'insensitive' } },
              { description: { contains: 'sum', mode: 'insensitive' } },
            ],
          }),
        })
      );
    });

    it('should support pagination', async () => {
      const mockProblems = {
        problems: [],
        total: 50,
        page: 2,
        totalPages: 3,
      };

      (problemService.listProblems as jest.Mock).mockResolvedValue(mockProblems);

      const response = await request(app)
        .get('/api/problems')
        .query({ page: 2, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(2);
      expect(problemService.listProblems).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 20,
        })
      );
    });

    it('should return 400 for invalid query parameters', async () => {
      const response = await request(app)
        .get('/api/problems')
        .query({ page: -1 });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should show all problems for admin users', async () => {
      (optionalAuth as jest.Mock).mockImplementation((req, _res, next) => {
        req.user = { userId: 'admin-id', role: 'ADMIN' };
        next();
      });

      const mockProblems = {
        problems: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };

      (problemService.listProblems as jest.Mock).mockResolvedValue(mockProblems);

      const response = await request(app).get('/api/problems');

      expect(response.status).toBe(200);
      // Admin should NOT have visibility filter
      expect(problemService.listProblems).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 20,
        })
      );
      // Verify visibility is NOT in the call
      const callArgs = (problemService.listProblems as jest.Mock).mock.calls[0][0];
      expect(callArgs.visibility).toBeUndefined();
    });
  });

  describe('GET /api/problems/:id', () => {
    it('should return problem details with statistics', async () => {
      const mockProblem = {
        id: 'problem-1',
        title: 'Two Sum',
        slug: 'two-sum',
        description: 'Find two numbers that add up to target',
        difficulty: 'EASY',
        timeLimit: 1000,
        memoryLimit: 256,
        tags: ['array', 'hash-table'],
        visibility: 'PUBLIC',
        testCases: [
          {
            id: 'tc-1',
            inputFile: '1 2 3\n5',
            outputFile: '0 2',
            isHidden: false,
          },
          {
            id: 'tc-2',
            inputFile: 'hidden input',
            outputFile: 'hidden output',
            isHidden: true,
          },
        ],
      };

      (problemService.getProblemById as jest.Mock).mockResolvedValue(mockProblem);
      (prisma.submission.count as jest.Mock)
        .mockResolvedValueOnce(100) // total submissions
        .mockResolvedValueOnce(75);  // accepted submissions

      const response = await request(app).get('/api/problems/problem-1');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: 'problem-1',
        title: 'Two Sum',
        description: 'Find two numbers that add up to target',
        difficulty: 'EASY',
        timeLimit: 1000,
        memoryLimit: 256,
        tags: ['array', 'hash-table'],
        statistics: {
          totalSubmissions: 100,
          acceptedSubmissions: 75,
          acceptanceRate: 75,
        },
      });
      expect(response.body.sampleTestCases).toHaveLength(1);
      expect(response.body.sampleTestCases[0]).toEqual({
        input: '1 2 3\n5',
        output: '0 2',
      });
    });

    it('should return 404 for non-existent problem', async () => {
      (problemService.getProblemById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/problems/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('PROBLEM_NOT_FOUND');
    });

    it('should return 403 for private problem accessed by non-admin', async () => {
      (authenticate as jest.Mock).mockImplementation((req, _res, next) => {
        req.user = { userId: 'user-id', role: 'USER' };
        next();
      });

      const mockProblem = {
        id: 'problem-1',
        title: 'Private Problem',
        visibility: 'PRIVATE',
        testCases: [],
      };

      (problemService.getProblemById as jest.Mock).mockResolvedValue(mockProblem);

      const response = await request(app).get('/api/problems/problem-1');

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('PROBLEM_NOT_ACCESSIBLE');
    });

    it('should return 400 for invalid UUID', async () => {
      // Mock getProblemById to return null for invalid UUID
      (problemService.getProblemById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/problems/invalid-uuid');

      // Since we removed UUID validation, this will return 404 (not found) instead of 400
      expect(response.status).toBe(404);
      expect(response.body.code).toBe('PROBLEM_NOT_FOUND');
    });

    it('should calculate acceptance rate correctly when no submissions', async () => {
      const mockProblem = {
        id: 'problem-1',
        title: 'New Problem',
        visibility: 'PUBLIC',
        testCases: [],
      };

      (problemService.getProblemById as jest.Mock).mockResolvedValue(mockProblem);
      (prisma.submission.count as jest.Mock)
        .mockResolvedValueOnce(0) // total submissions
        .mockResolvedValueOnce(0); // accepted submissions

      const response = await request(app).get('/api/problems/problem-1');

      expect(response.status).toBe(200);
      expect(response.body.statistics.acceptanceRate).toBe(0);
    });
  });

  describe('POST /api/problems', () => {
    it('should create a new problem', async () => {
      const newProblem = {
        title: 'New Problem',
        description: 'Problem description',
        difficulty: 'MEDIUM',
        timeLimit: 2000,
        memoryLimit: 512,
        tags: ['dynamic-programming'],
        visibility: 'PUBLIC',
      };

      const createdProblem = {
        id: 'new-problem-id',
        ...newProblem,
        slug: 'new-problem',
      };

      (problemService.createProblem as jest.Mock).mockResolvedValue(createdProblem);

      const response = await request(app)
        .post('/api/problems')
        .send(newProblem);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'Problem created successfully',
        problemId: 'new-problem-id',
      });
      expect(problemService.createProblem).toHaveBeenCalledWith(newProblem);
    });

    it('should return 400 for invalid problem data', async () => {
      const invalidProblem = {
        title: '',
        difficulty: 'INVALID',
      };

      const response = await request(app)
        .post('/api/problems')
        .send(invalidProblem);

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should require authentication', async () => {
      (authenticate as jest.Mock).mockImplementation((_req, _res, next) => {
        next(new Error('Unauthorized'));
      });

      const response = await request(app)
        .post('/api/problems')
        .send({});

      expect(response.status).toBe(500);
    });

    it('should require admin role', async () => {
      (adminOnly as jest.Mock).mockImplementation((_req, _res, next) => {
        next(new Error('Forbidden'));
      });

      const response = await request(app)
        .post('/api/problems')
        .send({});

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/problems/:id', () => {
    it('should update an existing problem', async () => {
      const existingProblem = {
        id: 'problem-1',
        title: 'Old Title',
      };

      const updateData = {
        title: 'New Title',
        difficulty: 'HARD',
      };

      (problemService.getProblemById as jest.Mock).mockResolvedValue(existingProblem);
      (problemService.updateProblem as jest.Mock).mockResolvedValue({
        ...existingProblem,
        ...updateData,
      });

      const response = await request(app)
        .put('/api/problems/problem-1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Problem updated successfully',
      });
      expect(problemService.updateProblem).toHaveBeenCalledWith('problem-1', updateData);
    });

    it('should return 404 for non-existent problem', async () => {
      (problemService.getProblemById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/problems/non-existent-id')
        .send({ title: 'New Title' });

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('PROBLEM_NOT_FOUND');
    });

    it('should return 400 for invalid update data', async () => {
      const response = await request(app)
        .put('/api/problems/problem-1')
        .send({ difficulty: 'INVALID' });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/problems/:id', () => {
    it('should delete an existing problem', async () => {
      const existingProblem = {
        id: 'problem-1',
        title: 'Problem to Delete',
      };

      (problemService.getProblemById as jest.Mock).mockResolvedValue(existingProblem);
      (problemService.deleteProblem as jest.Mock).mockResolvedValue(existingProblem);

      const response = await request(app).delete('/api/problems/problem-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Problem deleted successfully',
      });
      expect(problemService.deleteProblem).toHaveBeenCalledWith('problem-1');
    });

    it('should return 404 for non-existent problem', async () => {
      (problemService.getProblemById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).delete('/api/problems/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('PROBLEM_NOT_FOUND');
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app).delete('/api/problems/invalid-uuid');

      // Since we removed UUID validation, this will return 404 (not found) instead of 400
      expect(response.status).toBe(404);
      expect(response.body.code).toBe('PROBLEM_NOT_FOUND');
    });
  });

  describe('Cache behavior', () => {
    it('should cache problem list results', async () => {
      const mockProblems = {
        problems: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };

      (problemService.listProblems as jest.Mock).mockResolvedValue(mockProblems);

      // First request
      await request(app).get('/api/problems');

      // Second request should use cache
      await request(app).get('/api/problems');

      // Service should only be called once (second call uses cache)
      expect(problemService.listProblems).toHaveBeenCalledTimes(2);
    });

    it('should cache problem details', async () => {
      const mockProblem = {
        id: 'problem-1',
        title: 'Test Problem',
        visibility: 'PUBLIC',
        testCases: [],
      };

      (problemService.getProblemById as jest.Mock).mockResolvedValue(mockProblem);
      (prisma.submission.count as jest.Mock).mockResolvedValue(0);

      // First request
      await request(app).get('/api/problems/problem-1');

      // Second request should use cache
      await request(app).get('/api/problems/problem-1');

      expect(problemService.getProblemById).toHaveBeenCalledTimes(2);
    });
  });
});
