import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import {
  hashPassword,
  verifyPassword,
  needsRehash,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
} from '../services/authService';
import {
  // sendVerificationEmail, // TODO: Re-enable when email service is configured
  sendPasswordResetEmail,
} from '../services/emailService';
import { loginRateLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * Validation Schemas
 */

// Username: 3-20 alphanumeric characters
const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-zA-Z0-9]+$/, 'Username must be alphanumeric');

// Email: RFC 5322 format
const emailSchema = z.string().email('Invalid email format');

// Password: Min 8 chars, mixed case, numbers
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
});

/**
 * POST /api/auth/register
 * Register a new user account
 * Requirements: REQ-3.1, REQ-3.2, REQ-3.3, REQ-18.2, REQ-18.3, REQ-18.4
 */
router.post(
  '/register',
  loginRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const { username, email, password } = registerSchema.parse(req.body);

      // Check if username already exists
      const existingUsername = await prisma.user.findUnique({
        where: { username },
      });
      if (existingUsername) {
        throw new AppError(409, 'USERNAME_EXISTS', 'Username already exists');
      }

      // Check if email already exists
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        throw new AppError(409, 'EMAIL_EXISTS', 'Email already exists');
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Generate email verification token
      const { token: emailVerifyToken, expiry: emailVerifyExpiry } =
        generateEmailVerificationToken();

      // Create user in database
      const user = await prisma.user.create({
        data: {
          username,
          email,
          passwordHash,
          emailVerifyToken,
          emailVerifyExpiry,
          role: 'USER',
          isEmailVerified: true, // Auto-verify for now (email service disabled)
        },
      });

      // TODO: Re-enable when email service is configured
      // await sendVerificationEmail(email, emailVerifyToken, username);

      res.status(201).json({
        message: 'User registered successfully. Please check your email to verify your account.',
        userId: user.id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(
          new AppError(
            400,
            'VALIDATION_ERROR',
            'Invalid input data',
            error.errors
          )
        );
      }
      next(error);
    }
  }
);

/**
 * POST /api/auth/verify-email
 * Verify user email with token
 * Requirements: REQ-3.5
 */
router.post(
  '/verify-email',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const { token } = verifyEmailSchema.parse(req.body);

      // Find user with verification token
      const user = await prisma.user.findUnique({
        where: { emailVerifyToken: token },
      });

      if (!user) {
        throw new AppError(404, 'INVALID_TOKEN', 'Invalid verification token');
      }

      // Check token expiration (24 hours)
      if (!user.emailVerifyExpiry || user.emailVerifyExpiry < new Date()) {
        throw new AppError(400, 'TOKEN_EXPIRED', 'Verification token has expired');
      }

      // Update user: set isEmailVerified to true and clear verification token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          emailVerifyToken: null,
          emailVerifyExpiry: null,
        },
      });

      res.json({
        message: 'Email verified successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(
          new AppError(
            400,
            'VALIDATION_ERROR',
            'Invalid input data',
            error.errors
          )
        );
      }
      next(error);
    }
  }
);

/**
 * POST /api/auth/login
 * Login with email or username and password
 * Requirements: REQ-3.6, REQ-3.7
 */
router.post(
  '/login',
  loginRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const { email: emailOrUsername, password } = loginSchema.parse(req.body);

      // Query user by email or username
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: emailOrUsername },
            { username: emailOrUsername },
          ],
        },
      });

      if (!user) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email/username or password');
      }

      // Validate password against hash
      const isPasswordValid = await verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email/username or password');
      }

      // Generate JWT access token and refresh token
      const accessToken = generateAccessToken(user.id, user.role);
      const refreshToken = generateRefreshToken(user.id);

      // Transparent password re-hash: migrate legacy bcrypt hashes to Argon2id
      if (needsRehash(user.passwordHash)) {
        const newHash = await hashPassword(password);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: newHash },
        });
      }

      // Return tokens and user object
      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(
          new AppError(
            400,
            'VALIDATION_ERROR',
            'Invalid input data',
            error.errors
          )
        );
      }
      next(error);
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 * Requirements: REQ-3.7
 */
router.post(
  '/refresh',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const { refreshToken } = refreshTokenSchema.parse(req.body);

      // Validate refresh token
      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        throw new AppError(401, 'INVALID_TOKEN', 'Invalid or expired refresh token');
      }

      // Get user from database to get current role
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
      }

      // Generate new access token
      const accessToken = generateAccessToken(user.id, user.role);
      // Generate new refresh token (token rotation per SDD 5.1)
      const newRefreshToken = generateRefreshToken(user.id);

      res.json({
        accessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(
          new AppError(
            400,
            'VALIDATION_ERROR',
            'Invalid input data',
            error.errors
          )
        );
      }
      next(error);
    }
  }
);

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 * Requirements: REQ-3.9
 */
router.post(
  '/forgot-password',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const { email } = forgotPasswordSchema.parse(req.body);

      // Validate email exists
      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Always return success message to prevent email enumeration
      if (!user) {
        return res.json({
          message: 'If the email exists, a password reset link has been sent',
        });
      }

      // Generate password reset token
      const { token: passwordResetToken, expiry: passwordResetExpiry } =
        generatePasswordResetToken();

      // Update user with reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken,
          passwordResetExpiry,
        },
      });

      // Send password reset email
      await sendPasswordResetEmail(email, passwordResetToken, user.username);

      res.json({
        message: 'If the email exists, a password reset link has been sent',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(
          new AppError(
            400,
            'VALIDATION_ERROR',
            'Invalid input data',
            error.errors
          )
        );
      }
      next(error);
    }
  }
);

/**
 * POST /api/auth/reset-password
 * Reset password with token
 * Requirements: REQ-3.9
 */
router.post(
  '/reset-password',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const { token, newPassword } = resetPasswordSchema.parse(req.body);

      // Validate reset token and expiration
      const user = await prisma.user.findUnique({
        where: { passwordResetToken: token },
      });

      if (!user) {
        throw new AppError(404, 'INVALID_TOKEN', 'Invalid reset token');
      }

      // Check token expiration (1 hour)
      if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
        throw new AppError(400, 'TOKEN_EXPIRED', 'Reset token has expired');
      }

      // Hash new password
      const passwordHash = await hashPassword(newPassword);

      // Update user password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpiry: null,
        },
      });

      res.json({
        message: 'Password reset successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(
          new AppError(
            400,
            'VALIDATION_ERROR',
            'Invalid input data',
            error.errors
          )
        );
      }
      next(error);
    }
  }
);

export default router;
