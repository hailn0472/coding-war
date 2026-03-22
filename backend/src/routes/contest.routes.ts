import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';
import { optionalAuth, authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/authorize';
import * as contestService from '../services/contestService';
import { listContests, getContestById, createContest } from '../services/contestService';
import { paginationSchema, scoringRuleSchema, visibilitySchema } from '../utils/schemas';
import { createClient } from 'redis';
import { logger } from '../utils/logger';
import prisma from '../utils/prisma';

const router = Router();

/**
 * Redis client for caching
 */
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on('error', (err) => {
  logger.error('Redis contest cache client error', { error: err.message });
});

redisClient.on('connect', () => {
  logger.info('Redis contest cache client connected');
});

// Connect to Redis
redisClient.connect().catch((err) => {
  logger.error('Failed to connect Redis contest cache client', { error: err.message });
});

/**
 * Cache helper functions
 */
async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const cached = await redisClient.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
    return null;
  } catch (error) {
    logger.error('Redis get error', { key, error });
    return null;
  }
}

async function setCachedData(key: string, data: any, ttlSeconds: number): Promise<void> {
  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(data));
  } catch (error) {
    logger.error('Redis set error', { key, error });
  }
}

async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    logger.error('Redis invalidate error', { pattern, error });
  }
}

/**
 * Validation Schemas
 */

const contestStatusSchema = z.enum(['upcoming', 'ongoing', 'ended']);

const listContestsQuerySchema = paginationSchema.extend({
  status: contestStatusSchema.optional(),
});

/**
 * GET /api/contests
 * List contests with filtering and pagination
 * Requirements: REQ-10.1
 * 
 * Query parameters:
 * - status: 'upcoming' | 'ongoing' | 'ended' (optional)
 * - page: number (default: 1)
 * - limit: number (default: 20)
 * 
 * Response:
 * - contests: Array of contest objects with participant counts
 * - total: Total number of contests matching the filter
 * - page: Current page number
 * - totalPages: Total number of pages
 * 
 * Caching: Results are cached in Redis with 2 minutes TTL
 */
router.get(
  '/',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const query = listContestsQuerySchema.parse(req.query);
      
      // Generate cache key based on filter parameters
      const cacheKey = `contests:list:${query.status || 'all'}:${query.page}:${query.limit}`;
      
      // Check cache
      const cached = await getCachedData(cacheKey);
      if (cached) {
        logger.debug('Contest list cache hit', { cacheKey });
        return res.json(cached);
      }
      
      logger.debug('Contest list cache miss', { cacheKey });
      
      // Build filter for service
      const filter: any = {
        page: query.page,
        limit: query.limit,
      };
      
      if (query.status) {
        filter.status = query.status;
      }
      
      // List contests using service
      // The service filters by current time vs startTime/endTime
      const result = await listContests(filter);
      
      // Cache for 2 minutes (120 seconds) as per requirements
      await setCachedData(cacheKey, result, 120);
      
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
 * GET /api/contests/:id
 * Get contest details with problems list
 * Requirements: REQ-10.1
 * 
 * Path parameters:
 * - id: Contest ID
 * 
 * Response:
 * - Contest details with problems list
 * - isRegistered: Whether current user is registered (if authenticated)
 * - canRegister: Whether current user can register (if authenticated)
 * - participantCount: Number of participants
 * 
 * Caching: Results are cached in Redis with 5 minutes TTL
 */
router.get(
  '/:id',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      
      // Generate cache key based on contest ID and user ID (for user-specific flags)
      const cacheKey = `contest:${id}:${userId || 'anonymous'}`;
      
      // Check cache
      const cached = await getCachedData(cacheKey);
      if (cached) {
        logger.debug('Contest detail cache hit', { cacheKey });
        return res.json(cached);
      }
      
      logger.debug('Contest detail cache miss', { cacheKey });
      
      // Get contest details from service
      const contest = await getContestById(id);
      
      if (!contest) {
        return next(
          new AppError(404, 'CONTEST_NOT_FOUND', 'Contest not found')
        );
      }
      
      // Build response with user-specific flags
      const response: any = {
        ...contest,
        isRegistered: false,
        canRegister: false,
      };
      
      // If user is authenticated, check registration status and eligibility
      if (userId) {
        // Check if user is registered
        const participant = await prisma.contestParticipant.findUnique({
          where: {
            contestId_userId: {
              contestId: id,
              userId,
            },
          },
        });
        
        response.isRegistered = participant !== null;
        
        // Check if user can register
        // User can register if:
        // 1. Not already registered
        // 2. Contest hasn't started yet
        // 3. Contest is public (or user is in allowed list for private contests)
        const now = new Date();
        const contestNotStarted = new Date(contest.startTime) > now;
        const isPublic = contest.visibility === 'PUBLIC';
        
        response.canRegister = !response.isRegistered && contestNotStarted && isPublic;
      }
      
      // Cache for 5 minutes (300 seconds) as per requirements
      await setCachedData(cacheKey, response, 300);
      
      res.json(response);
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * POST /api/contests
 * Create a new contest (Admin only)
 * Requirements: REQ-10.1, REQ-10.2, REQ-10.3
 * 
 * Request body:
 * - title: string (required)
 * - description: string (required)
 * - startTime: string (ISO datetime, required)
 * - endTime: string (ISO datetime, required)
 * - freezeTime: number (minutes before end, optional)
 * - scoringRule: 'IOI' | 'ACM' (required)
 * - visibility: 'PUBLIC' | 'PRIVATE' (required)
 * - problemIds: string[] (array of problem IDs, required)
 * 
 * Response:
 * - contestId: string (ID of created contest)
 * 
 * Validation:
 * - All required fields must be present
 * - startTime must be before endTime
 * - Problems are added via ContestProblem junction table
 * - Contest list cache is invalidated
 */

const createContestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be at most 255 characters'),
  description: z.string().min(1, 'Description is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  freezeTime: z.number().int().min(0).optional(),
  scoringRule: scoringRuleSchema,
  visibility: visibilitySchema,
  problemIds: z.array(z.string().uuid('Invalid problem ID format')).min(1, 'At least one problem is required'),
}).refine((data) => {
  // Validate that startTime < endTime
  const startDate = new Date(data.startTime);
  const endDate = new Date(data.endTime);
  
  // Check if dates are valid
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return false;
  }
  
  return startDate < endDate;
}, {
  message: 'Start time must be before end time',
  path: ['startTime'], // This will make the error appear on the startTime field
});

router.post(
  '/',
  authenticate,
  adminOnly,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body (includes datetime and time range validation)
      const data = createContestSchema.parse(req.body);
      
      // Parse dates for database insertion
      const startTime = new Date(data.startTime);
      const endTime = new Date(data.endTime);
      
      // Verify all problems exist
      let problems;
      try {
        problems = await prisma.problem.findMany({
          where: {
            id: {
              in: data.problemIds,
            },
          },
          select: {
            id: true,
          },
        });
      } catch (error) {
        // If the query fails (e.g., invalid UUIDs), treat as invalid problems
        throw new AppError(
          400,
          'INVALID_PROBLEMS',
          'One or more problem IDs are invalid'
        );
      }
      
      if (!problems || problems.length !== data.problemIds.length) {
        throw new AppError(
          400,
          'INVALID_PROBLEMS',
          'One or more problem IDs are invalid'
        );
      }
      
      // Create contest in database
      const contest = await createContest({
        title: data.title,
        description: data.description,
        startTime,
        endTime,
        freezeTime: data.freezeTime,
        scoringRule: data.scoringRule,
        visibility: data.visibility,
      });
      
      // Add problems via ContestProblem junction table
      await prisma.contestProblem.createMany({
        data: data.problemIds.map((problemId, index) => ({
          contestId: contest.id,
          problemId,
          orderIndex: index,
          points: data.scoringRule === 'IOI' ? 100 : null, // Default 100 points for IOI
        })),
      });
      
      // Invalidate contest list cache
      await invalidateCache('contests:list:*');
      
      logger.info('Contest created', {
        contestId: contest.id,
        title: contest.title,
        userId: req.user?.userId,
      });
      
      res.status(201).json({
        contestId: contest.id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Check if the error is the time range validation error
        const timeRangeError = error.errors.find(
          (err) => err.message === 'Start time must be before end time'
        );
        
        if (timeRangeError) {
          return next(
            new AppError(400, 'INVALID_TIME_RANGE', 'Start time must be before end time')
          );
        }
        
        return next(
          new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', error.errors)
        );
      }
      return next(error);
    }
  }
);

/**
 * PUT /api/contests/:id
 * Update an existing contest (Admin only)
 * Requirements: REQ-10.1
 * 
 * Path parameters:
 * - id: Contest ID
 * 
 * Request body (all fields optional):
 * - title: string (1-255 characters)
 * - description: string
 * - startTime: string (ISO datetime)
 * - endTime: string (ISO datetime)
 * - freezeTime: number (minutes before end)
 * - scoringRule: 'IOI' | 'ACM'
 * - visibility: 'PUBLIC' | 'PRIVATE'
 * 
 * Response:
 * - Updated contest object
 * 
 * Validation:
 * - At least one field must be provided
 * - If startTime or endTime are updated, validates startTime < endTime
 * - Contest detail cache and list cache are invalidated
 */

const updateContestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be at most 255 characters').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  startTime: z.string().min(1, 'Start time is required').optional(),
  endTime: z.string().min(1, 'End time is required').optional(),
  freezeTime: z.number().int().min(0).optional(),
  scoringRule: scoringRuleSchema.optional(),
  visibility: visibilitySchema.optional(),
}).refine((data) => {
  // At least one field must be provided
  return Object.keys(data).length > 0;
}, {
  message: 'At least one field must be provided for update',
});

router.put(
  '/:id',
  authenticate,
  adminOnly,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      
      // Validate request body
      const data = updateContestSchema.parse(req.body);
      
      // Get existing contest to validate time range if needed
      const existingContest = await getContestById(id);
      
      if (!existingContest) {
        return next(
          new AppError(404, 'CONTEST_NOT_FOUND', 'Contest not found')
        );
      }
      
      // Validate time range if startTime or endTime are being updated
      if (data.startTime || data.endTime) {
        const startTime = data.startTime ? new Date(data.startTime) : new Date(existingContest.startTime);
        const endTime = data.endTime ? new Date(data.endTime) : new Date(existingContest.endTime);
        
        // Check if dates are valid
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          return next(
            new AppError(400, 'INVALID_DATETIME', 'Invalid datetime format')
          );
        }
        
        // Validate startTime < endTime
        if (startTime >= endTime) {
          return next(
            new AppError(400, 'INVALID_TIME_RANGE', 'Start time must be before end time')
          );
        }
      }
      
      // Prepare update data
      const updateData: any = {};
      
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.startTime !== undefined) updateData.startTime = new Date(data.startTime);
      if (data.endTime !== undefined) updateData.endTime = new Date(data.endTime);
      if (data.freezeTime !== undefined) updateData.freezeTime = data.freezeTime;
      if (data.scoringRule !== undefined) updateData.scoringRule = data.scoringRule;
      if (data.visibility !== undefined) updateData.visibility = data.visibility;
      
      // Update contest using service
      const updatedContest = await contestService.updateContest(id, updateData);
      
      // Invalidate both contest detail cache and list cache
      await invalidateCache(`contest:${id}:*`); // Invalidate all user-specific caches for this contest
      await invalidateCache('contests:list:*'); // Invalidate all list caches
      
      logger.info('Contest updated', {
        contestId: id,
        updatedFields: Object.keys(data),
        userId: req.user?.userId,
      });
      
      res.json(updatedContest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(
          new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', error.errors)
        );
      }
      return next(error);
    }
  }
);

/**
 * DELETE /api/contests/:id
 * Delete a contest (Admin only)
 * Requirements: REQ-10.1
 * 
 * Path parameters:
 * - id: Contest ID
 * 
 * Response:
 * - message: Success message
 * 
 * Behavior:
 * - Verifies contest exists before deletion
 * - Deletes contest using contestService.deleteContest
 * - Cascade deletes ContestProblem and ContestParticipant records
 * - Invalidates both contest detail cache and list cache
 */
router.delete(
  '/:id',
  authenticate,
  adminOnly,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      
      // Verify contest exists
      const existingContest = await getContestById(id);
      
      if (!existingContest) {
        return next(
          new AppError(404, 'CONTEST_NOT_FOUND', 'Contest not found')
        );
      }
      
      // Delete contest (cascade to ContestProblem and ContestParticipant)
      await contestService.deleteContest(id);
      
      // Invalidate both contest detail cache and list cache
      await invalidateCache(`contest:${id}:*`); // Invalidate all user-specific caches for this contest
      await invalidateCache('contests:list:*'); // Invalidate all list caches
      
      logger.info('Contest deleted', {
        contestId: id,
        title: existingContest.title,
        userId: req.user?.userId,
      });
      
      res.json({
        message: 'Contest deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * POST /api/contests/:id/register
 * Register current user for a contest
 * Requirements: REQ-10.4, REQ-10.5
 * 
 * Path parameters:
 * - id: Contest ID
 * 
 * Response:
 * - message: Success message
 * 
 * Validation:
 * - User must be authenticated
 * - Contest must exist
 * - Contest must not have started yet
 * - Contest must be public (or user must be in allowed list for private contests)
 * - User must not already be registered
 */
router.post(
  '/:id/register',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contestId = req.params.id as string;
      const userId = req.user!.userId;
      
      // Register user for contest using service
      // Service will validate all requirements and throw appropriate errors
      await contestService.registerForContest(contestId, userId);
      
      // Invalidate contest detail cache (participant count changed)
      await invalidateCache(`contest:${contestId}:*`);
      
      logger.info('User registered for contest', {
        contestId,
        userId,
      });
      
      res.status(201).json({
        message: 'Successfully registered for contest',
      });
    } catch (error) {
      // Convert service errors to appropriate HTTP errors
      if (error instanceof Error) {
        if (error.message === 'Contest not found') {
          return next(
            new AppError(404, 'CONTEST_NOT_FOUND', 'Contest not found')
          );
        }
        if (error.message === 'Cannot register after contest has started') {
          return next(
            new AppError(400, 'CONTEST_STARTED', 'Cannot register after contest has started')
          );
        }
        if (error.message === 'This is a private contest. Registration requires invitation.') {
          return next(
            new AppError(403, 'PRIVATE_CONTEST', 'This is a private contest. Registration requires invitation.')
          );
        }
        if (error.message === 'User is already registered for this contest') {
          return next(
            new AppError(409, 'ALREADY_REGISTERED', 'User is already registered for this contest')
          );
        }
      }
      return next(error);
    }
  }
);

/**
 * GET /api/contests/:id/scoreboard
 * Get contest scoreboard with rankings
 * Requirements: REQ-11.7, REQ-11.8, REQ-12.1, REQ-12.2, REQ-12.5, REQ-12.6
 * 
 * Path parameters:
 * - id: Contest ID
 * 
 * Response:
 * - participants: Array of ranked participants with scores
 * - isFrozen: Whether scoreboard is frozen for the current user
 * - freezeTime: When the scoreboard was frozen (if applicable)
 * 
 * Behavior:
 * - Returns live scoreboard for admins
 * - Returns frozen scoreboard for contestants during freeze period
 * - Scoreboard is cached in Redis (30 seconds TTL during contest)
 * - Includes problem-level details for each participant
 */
router.get(
  '/:id/scoreboard',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contestId = req.params.id as string;
      const isAdmin = req.user?.role === 'ADMIN';
      
      // Import scoreboardService dynamically to avoid circular dependency
      const { generateScoreboard } = await import('../services/scoreboardService');
      
      // Generate scoreboard
      const scoreboard = await generateScoreboard(contestId, isAdmin);
      
      res.json(scoreboard);
    } catch (error) {
      if (error instanceof Error && error.message === 'Contest not found') {
        return next(
          new AppError(404, 'CONTEST_NOT_FOUND', 'Contest not found')
        );
      }
      return next(error);
    }
  }
);

export default router;
export { redisClient as contestCacheClient, invalidateCache as invalidateContestCache };
