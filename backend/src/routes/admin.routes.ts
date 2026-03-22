import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/authorize';
import {
  getAllUsers,
  updateUserRole,
  getSystemStatistics,
} from '../services/adminService';
import { rejudgeSubmission } from '../services/submissionService';
import {
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

/**
 * Validation Schemas
 */

const getUsersQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'USER', 'GUEST']).optional(),
});

const updateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'USER', 'GUEST'], {
    errorMap: () => ({ message: 'Role must be ADMIN, USER, or GUEST' }),
  }),
});

/**
 * GET /api/admin/users
 * Get paginated list of all users (Admin only)
 * Requirements: REQ-13.3
 */
router.get(
  '/users',
  authenticate,
  adminOnly,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const query = getUsersQuerySchema.parse(req.query);

      // Get users
      const result = await getAllUsers({
        page: query.page,
        limit: query.limit,
        search: query.search,
        role: query.role,
      });

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

/**
 * PUT /api/admin/users/:id/role
 * Update user role (Admin only)
 * Requirements: REQ-13.3
 */
router.put(
  '/users/:id/role',
  authenticate,
  adminOnly,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate user ID
      const userId = uuidSchema.parse(req.params.id);

      // Validate request body
      const data = updateUserRoleSchema.parse(req.body);

      // Update user role
      await updateUserRole(userId, data.role);

      res.json({
        message: 'User role updated successfully',
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
 * GET /api/admin/statistics
 * Get system-wide statistics (Admin only)
 * Requirements: REQ-13.5
 */
router.get(
  '/statistics',
  authenticate,
  adminOnly,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // Check cache first (5 minutes TTL)
      const cacheKey = 'admin:statistics';
      const cachedStats = await getCachedData<any>(cacheKey);
      
      if (cachedStats) {
        return res.json(cachedStats);
      }

      // Get statistics
      const statistics = await getSystemStatistics();

      // Cache the result
      await setCachedData(cacheKey, statistics, 300); // 5 minutes

      res.json(statistics);
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * POST /api/submissions/:id/rejudge
 * Rejudge a submission (Admin only)
 * Requirements: REQ-13.6, REQ-13.7
 */
router.post(
  '/submissions/:id/rejudge',
  authenticate,
  adminOnly,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate submission ID
      const submissionId = uuidSchema.parse(req.params.id);

      // Rejudge submission
      await rejudgeSubmission(submissionId);

      res.json({
        message: 'Submission requeued for judging',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(
          new AppError(400, 'VALIDATION_ERROR', 'Invalid submission ID', error.errors)
        );
      }
      return next(error);
    }
  }
);

export default router;
