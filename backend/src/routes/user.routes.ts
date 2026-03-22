import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import {
  getUserProfile,
  updateUserProfile,
  getUserSubmissions,
} from '../services/userService';
import {
  emailSchema,
  passwordSchema,
  paginationSchema,
  uuidSchema,
} from '../utils/schemas';
import { createClient } from 'redis';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Redis client for caching
 */
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      password: process.env.REDIS_PASSWORD,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    await redisClient.connect();
  }
  return redisClient;
}

/**
 * Cache helper functions
 */
async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Redis get error:', error);
    return null;
  }
}

async function setCachedData(key: string, data: any, ttlSeconds: number): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.setEx(key, ttlSeconds, JSON.stringify(data));
  } catch (error) {
    logger.error('Redis set error:', error);
  }
}

async function invalidateCache(pattern: string): Promise<void> {
  try {
    const client = await getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    logger.error('Redis invalidate error:', error);
  }
}

/**
 * Validation Schemas
 */

const updateUserSchema = z.object({
  email: emailSchema.optional(),
  currentPassword: z.string().optional(),
  newPassword: passwordSchema.optional(),
}).refine(
  (data) => {
    // If newPassword is provided, currentPassword must also be provided
    if (data.newPassword && !data.currentPassword) {
      return false;
    }
    return true;
  },
  {
    message: 'Current password is required when changing password',
    path: ['currentPassword'],
  }
);

const getUserSubmissionsQuerySchema = paginationSchema;

/**
 * GET /api/users/:id
 * Get user profile with statistics
 * Requirements: REQ-5.5
 */
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate user ID
      const userId = uuidSchema.parse(req.params.id);

      // Check cache first (5 minutes TTL)
      const cacheKey = `user:profile:${userId}`;
      const cachedProfile = await getCachedData<any>(cacheKey);
      
      if (cachedProfile) {
        return res.json(cachedProfile);
      }

      // Get user profile
      const profile = await getUserProfile(
        userId,
        req.user!.userId,
        req.user!.role
      );

      // Cache the result
      await setCachedData(cacheKey, profile, 300); // 5 minutes

      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(
          new AppError(400, 'VALIDATION_ERROR', 'Invalid user ID', error.errors)
        );
      }
      return next(error);
    }
  }
);

/**
 * PUT /api/users/:id
 * Update user profile
 * Requirements: REQ-5.5
 */
router.put(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate user ID
      const userId = uuidSchema.parse(req.params.id);

      // Validate request body
      const data = updateUserSchema.parse(req.body);

      // Check authorization: users can only update their own profile, admins can update any
      if (req.user!.userId !== userId && req.user!.role !== 'ADMIN') {
        throw new AppError(403, 'FORBIDDEN', 'You can only update your own profile');
      }

      // Update user profile
      const updatedUser = await updateUserProfile(
        userId,
        data,
        req.user!.userId
      );

      // Invalidate cache
      await invalidateCache(`user:profile:${userId}`);

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(
          new AppError(400, 'VALIDATION_ERROR', 'Invalid input data', error.errors)
        );
      }
      return next(error);
    }
  }
);

/**
 * GET /api/users/:id/submissions
 * Get user's submission history
 * Requirements: REQ-9.1, REQ-9.2
 */
router.get(
  '/:id/submissions',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate user ID
      const userId = uuidSchema.parse(req.params.id);

      // Validate query parameters
      const query = getUserSubmissionsQuerySchema.parse(req.query);

      // Get user submissions
      const result = await getUserSubmissions(
        userId,
        {
          page: query.page,
          limit: query.limit,
        },
        req.user!.userId,
        req.user!.role
      );

      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(
          new AppError(400, 'VALIDATION_ERROR', 'Invalid query parameters', error.errors)
        );
      }
      return next(error);
    }
  }
);

export default router;
