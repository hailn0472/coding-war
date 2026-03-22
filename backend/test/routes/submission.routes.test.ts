import request from 'supertest';
import express from 'express';
import submissionRoutes from '../../src/../src/routes/submission.routes';
import prisma from '../../src/../src/utils/prisma';
import { errorHandler } from '../../src/../src/middleware/errorHandler';
import { requestIdMiddleware } from '../../src/../src/middleware/requestId';
import { generateAccessToken } from '../../src/../src/services/authService';

// Mock the submission queue
jest.mock('../../src/services/submissionQueue', () => ({
  enqueueSubmission: jest.fn().mockResolvedValue('job-123'),
}));

// Create test app
const app = express();
app.use(requestIdMiddleware);
app.use(express.json());
app.use('/api/submissions', submissionRoutes);
app.use(errorHandler);

describe('Submission Routes', () => {
  let testUser: any;
  let testAdmin: any;
  let testProblem: any;
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // Clean up existing test data
    await prisma.testCaseResult.deleteMany({});
    await prisma.submission.deleteMany({});
    await prisma.contestParticipant.deleteMany({});
    await prisma.contest.deleteMany({});
    await prisma.testCase.deleteMany({});
    await prisma.problem.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'submittest@example.com' },
          { email: 'submitadmin@example.com' },
        ],
      },
    });

    // Create test user
    testUser = await prisma.user.create({
      data: {
        username: 'submittest',
        email: 'submittest@example.com',
        passwordHash: 'hash',
        role: 'USER',
      },
    });

    // Create test admin
    testAdmin = await prisma.user.create({
      data: {
        username: 'submitadmin',
        email: 'submitadmin@example.com',
        passwordHash: 'hash',
        role: 'ADMIN',
      },
    });

    // Create test problem
    testProblem = await prisma.problem.create({
      data: {
        title: 'Submission Test Problem',
        slug: 'submission-test-problem',
        description: 'Test description',
        difficulty: 'EASY',
        timeLimit: 1000,
        memoryLimit: 256,
        tags: [],
        visibility: 'PUBLIC',
      },
    });

    // Generate tokens
    userToken = generateAccessToken(testUser.id, testUser.role);
    adminToken = generateAccessToken(testAdmin.id, testAdmin.role);
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.testCaseResult.deleteMany({});
    await prisma.submission.deleteMany({});
    await prisma.contestParticipant.deleteMany({});
    await prisma.contest.deleteMany({});
    await prisma.testCase.deleteMany({});
    await prisma.problem.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'submittest@example.com' },
          { email: 'submitadmin@example.com' },
        ],
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/submissions', () => {
    it('should create a submission with valid data', async () => {
      const response = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          problemId: testProblem.id,
          language: 'CPP',
          sourceCode: '#include <iostream>\nint main() { return 0; }',
        })
        .expect(201);

      expect(response.body).toHaveProperty('submissionId');
      expect(response.body.status).toBe('queued');
    });

    it('should store contestRelativeTime when submitting to a contest', async () => {
      // Create a test contest
      const contest = await prisma.contest.create({
        data: {
          title: 'Test Contest',
          slug: 'test-contest-submission',
          description: 'Test',
          startTime: new Date(Date.now() - 30 * 60 * 1000), // Started 30 minutes ago
          endTime: new Date(Date.now() + 60 * 60 * 1000), // Ends in 60 minutes
          scoringRule: 'ACM',
          visibility: 'PUBLIC',
        },
      });

      // Register user for contest
      await prisma.contestParticipant.create({
        data: {
          contestId: contest.id,
          userId: testUser.id,
        },
      });

      // Submit to contest
      const response = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          problemId: testProblem.id,
          language: 'CPP',
          sourceCode: '#include <iostream>\nint main() { return 0; }',
          contestId: contest.id,
        })
        .expect(201);

      expect(response.body).toHaveProperty('submissionId');

      // Verify contestRelativeTime was stored
      const submission = await prisma.submission.findUnique({
        where: { id: response.body.submissionId },
      });

      expect(submission).not.toBeNull();
      expect(submission!.contestRelativeTime).not.toBeNull();
      expect(submission!.contestRelativeTime).toBeGreaterThanOrEqual(30); // At least 30 minutes
      expect(submission!.contestRelativeTime).toBeLessThanOrEqual(35); // Should be around 30 minutes

      // Clean up
      await prisma.contestParticipant.deleteMany({ where: { contestId: contest.id } });
      await prisma.contest.delete({ where: { id: contest.id } });
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/submissions')
        .send({
          problemId: testProblem.id,
          language: 'CPP',
          sourceCode: 'code',
        })
        .expect(401);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          problemId: testProblem.id,
        })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/submissions/:id', () => {
    let testSubmission: any;

    beforeAll(async () => {
      testSubmission = await prisma.submission.create({
        data: {
          userId: testUser.id,
          problemId: testProblem.id,
          language: 'CPP',
          sourceCode: 'test code',
          status: 'ACCEPTED',
          verdict: 'Accepted',
          executionTime: 100,
          memoryUsed: 10,
        },
      });
    });

    it('should return submission details for owner', async () => {
      const response = await request(app)
        .get(`/api/submissions/${testSubmission.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.id).toBe(testSubmission.id);
      expect(response.body.userId).toBe(testUser.id);
      expect(response.body.status).toBe('ACCEPTED');
    });

    it('should return submission details for admin', async () => {
      const response = await request(app)
        .get(`/api/submissions/${testSubmission.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(testSubmission.id);
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`/api/submissions/${testSubmission.id}`)
        .expect(401);
    });
  });

  describe('GET /api/submissions', () => {
    it('should list user submissions', async () => {
      const response = await request(app)
        .get('/api/submissions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('submissions');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(Array.isArray(response.body.submissions)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/submissions?page=1&limit=5')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.submissions.length).toBeLessThanOrEqual(5);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/submissions')
        .expect(401);
    });
  });

  describe('POST /api/submissions/:id/rejudge', () => {
    let testSubmission: any;

    beforeAll(async () => {
      testSubmission = await prisma.submission.create({
        data: {
          userId: testUser.id,
          problemId: testProblem.id,
          language: 'CPP',
          sourceCode: 'rejudge test',
          status: 'ACCEPTED',
          verdict: 'Accepted',
          executionTime: 100,
          memoryUsed: 10,
          judgedAt: new Date(),
        },
      });
    });

    it('should rejudge submission as admin', async () => {
      const response = await request(app)
        .post(`/api/submissions/${testSubmission.id}/rejudge`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('Submission queued for rejudging');
    });

    it('should deny access to non-admin users', async () => {
      await request(app)
        .post(`/api/submissions/${testSubmission.id}/rejudge`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(app)
        .post(`/api/submissions/${testSubmission.id}/rejudge`)
        .expect(401);
    });
  });
});
