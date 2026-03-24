import request from 'supertest';
import express from 'express';
import authRoutes from '../../src/../src/routes/auth.routes';
import prisma from '../../src/utils/prisma';
import { errorHandler } from '../../src/middleware/errorHandler';
import { requestIdMiddleware } from '../../src/middleware/requestId';

// Create test app
const app = express();
app.use(requestIdMiddleware);
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

// Test data
const testUser = {
  username: 'testuser123',
  email: 'testuser@example.com',
  password: 'TestPass123',
};

describe('Auth Routes', () => {
  // Clean up test data before and after tests
  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: testUser.email },
          { username: testUser.username },
        ],
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: testUser.email },
          { username: testUser.username },
        ],
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('userId');
      expect(response.body.message).toContain('registered successfully');
    });

    it('should reject registration with existing username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);

      expect(response.body.code).toBe('USERNAME_EXISTS');
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'invalid-email',
          password: 'TestPass123',
        })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser2',
          email: 'newuser2@example.com',
          password: 'weak',
        })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject registration with short username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'ab',
          email: 'newuser3@example.com',
          password: 'TestPass123',
        })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      // Get the verification token from database
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
      });

      expect(user).not.toBeNull();
      expect(user?.emailVerifyToken).not.toBeNull();

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: user?.emailVerifyToken })
        .expect(200);

      expect(response.body.message).toContain('verified successfully');

      // Verify user is now verified
      const verifiedUser = await prisma.user.findUnique({
        where: { email: testUser.email },
      });
      expect(verifiedUser?.isEmailVerified).toBe(true);
      expect(verifiedUser?.emailVerifyToken).toBeNull();
    });

    it('should reject invalid verification token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token-12345' })
        .expect(404);

      expect(response.body.code).toBe('INVALID_TOKEN');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid email and password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.username).toBe(testUser.username);
    });

    it('should login with valid username and password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.username,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123',
        })
        .expect(401);

      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPass123',
        })
        .expect(401);

      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      // Login to get a refresh token
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });
      refreshToken = response.body.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.code).toBe('INVALID_TOKEN');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send password reset email for existing user', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      expect(response.body.message).toContain('password reset link');

      // Verify reset token was created
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
      });
      expect(user?.passwordResetToken).not.toBeNull();
      expect(user?.passwordResetExpiry).not.toBeNull();
    });

    it('should return success message for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.message).toContain('password reset link');
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let resetToken: string;

    beforeAll(async () => {
      // Request password reset to get token
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email });

      // Get reset token from database
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
      });
      resetToken = user?.passwordResetToken || '';
    });

    it('should reset password with valid token', async () => {
      const newPassword = 'NewTestPass456';
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword,
        })
        .expect(200);

      expect(response.body.message).toContain('reset successfully');

      // Verify reset token was cleared
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
      });
      expect(user?.passwordResetToken).toBeNull();

      // Verify can login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: newPassword,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('accessToken');

      // Reset password back to original for other tests
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email });

      const updatedUser = await prisma.user.findUnique({
        where: { email: testUser.email },
      });

      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: updatedUser?.passwordResetToken,
          newPassword: testUser.password,
        });
    });

    it('should reject invalid reset token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token-12345',
          newPassword: 'NewTestPass456',
        })
        .expect(404);

      expect(response.body.code).toBe('INVALID_TOKEN');
    });

    it('should reject weak new password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'weak',
        })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });
});
