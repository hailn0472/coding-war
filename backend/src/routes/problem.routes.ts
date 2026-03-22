import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { AppError } from '../middleware/errorHandler';
import { authenticate, optionalAuth } from '../middleware/auth';
import { adminOnly } from '../middleware/authorize';
import {
  createProblem,
  updateProblem,
  deleteProblem,
  getProblemById,
  listProblems,
} from '../services/problemService';
import { uploadTestCases } from '../services/testCaseService';
import {
  difficultySchema,
  visibilitySchema,
  paginationSchema,
  positiveIntSchema,
} from '../utils/schemas';
import { createClient } from 'redis';
import { logger } from '../utils/logger';
import prisma from '../utils/prisma';

const router = Router();

/**
 * Multer configuration for file uploads
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max file size
  },
  fileFilter: (_req, file, cb) => {
    // Only accept zip files
    if (file.mimetype === 'application/zip' || 
        file.mimetype === 'application/x-zip-compressed' ||
        file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'INVALID_FILE_TYPE', 'Only .zip files are allowed'));
    }
  },
});

/**
 * Redis client for caching
 */
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on('error', (err) => {
  logger.error('Redis cache client error', { error: err.message });
});

redisClient.on('connect', () => {
  logger.info('Redis cache client connected');
});

// Connect to Redis
redisClient.connect().catch((err) => {
  logger.error('Failed to connect Redis cache client', { error: err.message });
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

const listProblemsQuerySchema = paginationSchema.extend({
  difficulty: difficultySchema.optional(),
  search: z.string().optional(),
  tags: z.string().optional(), // Comma-separated tags
});

const createProblemSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  difficulty: difficultySchema,
  timeLimit: positiveIntSchema,
  memoryLimit: positiveIntSchema,
  tags: z.array(z.string()).default([]),
  visibility: visibilitySchema.default('PUBLIC'),
});

const updateProblemSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  difficulty: difficultySchema.optional(),
  timeLimit: positiveIntSchema.optional(),
  memoryLimit: positiveIntSchema.optional(),
  tags: z.array(z.string()).optional(),
  visibility: visibilitySchema.optional(),
});

/**
 * GET /api/problems
 * List problems with filtering and pagination
 * Requirements: REQ-5.1, REQ-5.8, REQ-15.2
 */
router.get(
  '/',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const query = listProblemsQuerySchema.parse(req.query);
      
      // Parse tags if provided
      const tags = query.tags ? query.tags.split(',').map(t => t.trim()) : undefined;
      
      // Determine visibility filter based on user role
      let visibilityFilter: string | undefined;
      
      // If user is authenticated and is admin, show all problems
      if (req.user?.role === 'ADMIN') {
        visibilityFilter = undefined;
      } else {
        // Non-admin users can only see PUBLIC problems
        visibilityFilter = 'PUBLIC';
      }
      
      // Generate cache key
      const cacheKey = `problems:list:${query.page}:${query.limit}:${query.difficulty || 'all'}:${tags?.join(',') || 'all'}:${query.search || 'all'}:${visibilityFilter || 'all'}`;
      
      // Check cache
      const cached = await getCachedData(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      
      // Build filter
      const filter: any = {
        page: query.page,
        limit: query.limit,
      };
      
      if (query.difficulty) {
        filter.difficulty = query.difficulty;
      }
      
      if (tags && tags.length > 0) {
        filter.tags = tags;
      }
      
      if (visibilityFilter) {
        filter.visibility = visibilityFilter;
      }
      
      // If search is provided, we need to filter by title or description
      if (query.search) {
        // Get problems with search
        const where: any = {};
        
        if (filter.difficulty) {
          where.difficulty = filter.difficulty;
        }
        
        if (filter.tags) {
          where.tags = { hasSome: filter.tags };
        }
        
        if (filter.visibility) {
          where.visibility = filter.visibility;
        }
        
        // Add search condition
        where.OR = [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ];
        
        const skip = (query.page - 1) * query.limit;
        
        const [problems, total] = await Promise.all([
          prisma.problem.findMany({
            where,
            skip,
            take: query.limit,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              title: true,
              slug: true,
              difficulty: true,
              tags: true,
              visibility: true,
              createdAt: true,
            },
          }),
          prisma.problem.count({ where }),
        ]);
        
        const result = {
          problems,
          total,
          page: query.page,
          totalPages: Math.ceil(total / query.limit),
        };
        
        // Cache for 5 minutes
        await setCachedData(cacheKey, result, 300);
        
        return res.json(result);
      }
      
      // List problems using service
      const result = await listProblems(filter);
      
      // Cache for 5 minutes (300 seconds)
      await setCachedData(cacheKey, result, 300);
      
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
 * GET /api/problems/:id
 * Get problem details by ID
 * Requirements: REQ-5.2
 */
router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate problem ID - accept any string, will check existence in DB
      const id = req.params.id as string;
      
      // Generate cache key
      const cacheKey = `problem:${id}`;
      
      // Check cache
      const cached = await getCachedData(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      
      // Get problem from database
      const problem = await getProblemById(id);
      
      if (!problem) {
        throw new AppError(404, 'PROBLEM_NOT_FOUND', 'Problem not found');
      }
      
      // Check visibility - non-admin users can only see PUBLIC problems
      if (problem.visibility !== 'PUBLIC' && req.user?.role !== 'ADMIN') {
        throw new AppError(403, 'PROBLEM_NOT_ACCESSIBLE', 'You do not have access to this problem');
      }
      
      // Get statistics
      const [totalSubmissions, acceptedSubmissions] = await Promise.all([
        prisma.submission.count({ where: { problemId: id } }),
        prisma.submission.count({ where: { problemId: id, status: 'ACCEPTED' } }),
      ]);
      
      const acceptanceRate = totalSubmissions > 0 
        ? Math.round((acceptedSubmissions / totalSubmissions) * 100) 
        : 0;
      
      // Filter test cases - only show non-hidden (sample) test cases
      const sampleTestCases = problem.testCases
        .filter(tc => !tc.isHidden)
        .map(tc => ({
          input: tc.inputFile,
          output: tc.outputFile,
        }));
      
      const result = {
        id: problem.id,
        title: problem.title,
        slug: problem.slug,
        description: problem.description, // Supports Markdown and LaTeX
        difficulty: problem.difficulty,
        timeLimit: problem.timeLimit,
        memoryLimit: problem.memoryLimit,
        tags: problem.tags,
        sampleTestCases,
        statistics: {
          totalSubmissions,
          acceptedSubmissions,
          acceptanceRate,
        },
      };
      
      // Cache for 10 minutes (600 seconds)
      await setCachedData(cacheKey, result, 600);
      
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * POST /api/problems
 * Create a new problem (Admin only)
 * Requirements: REQ-5.1
 */
router.post(
  '/',
  authenticate,
  adminOnly,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const data = createProblemSchema.parse(req.body);
      
      // Create problem
      const problem = await createProblem(data);
      
      // Invalidate problem list cache
      await invalidateCache('problems:list:*');
      
      res.status(201).json({
        message: 'Problem created successfully',
        problemId: problem.id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(
          new AppError(400, 'VALIDATION_ERROR', 'Invalid problem data', error.errors)
        );
      }
      return next(error);
    }
  }
);

/**
 * PUT /api/problems/:id
 * Update a problem (Admin only)
 * Requirements: REQ-5.6
 */
router.put(
  '/:id',
  authenticate,
  adminOnly,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate problem ID - accept any string, will check existence in DB
      const id = req.params.id as string;
      
      // Validate request body
      const data = updateProblemSchema.parse(req.body);
      
      // Check if problem exists
      const existing = await getProblemById(id);
      if (!existing) {
        throw new AppError(404, 'PROBLEM_NOT_FOUND', 'Problem not found');
      }
      
      // Update problem
      await updateProblem(id, data);
      
      // Invalidate caches
      await invalidateCache(`problem:${id}`);
      await invalidateCache('problems:list:*');
      
      res.json({
        message: 'Problem updated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(
          new AppError(400, 'VALIDATION_ERROR', 'Invalid problem data', error.errors)
        );
      }
      return next(error);
    }
  }
);

/**
 * DELETE /api/problems/:id
 * Delete a problem (Admin only)
 * Requirements: REQ-5.7
 */
router.delete(
  '/:id',
  authenticate,
  adminOnly,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate problem ID - accept any string, will check existence in DB
      const id = req.params.id as string;
      
      // Check if problem exists
      const existing = await getProblemById(id);
      if (!existing) {
        throw new AppError(404, 'PROBLEM_NOT_FOUND', 'Problem not found');
      }
      
      // Delete problem (cascade to test cases and submissions)
      await deleteProblem(id);
      
      // Invalidate all related caches
      await invalidateCache(`problem:${id}`);
      await invalidateCache('problems:list:*');
      res.json({
        message: 'Problem deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * POST /api/problems/:id/test-cases
 * Upload test cases for a problem (Admin only)
 * Requirements: REQ-5.3, REQ-5.4
 */
router.post(
  '/:id/test-cases',
  authenticate,
  adminOnly,
  upload.single('testCases'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate problem ID
      const id = req.params.id as string;
      
      // Check if file was uploaded
      if (!req.file) {
        throw new AppError(400, 'NO_FILE_UPLOADED', 'No test case file uploaded');
      }
      
      // Validate file size
      if (req.file.size === 0) {
        throw new AppError(400, 'EMPTY_FILE', 'Uploaded file is empty');
      }
      
      // Parse sampleCount from request body (optional)
      const sampleCount = req.body.sampleCount ? parseInt(req.body.sampleCount, 10) : 0;
      
      if (isNaN(sampleCount) || sampleCount < 0) {
        throw new AppError(400, 'INVALID_SAMPLE_COUNT', 'Sample count must be a non-negative integer');
      }
      
      // Upload test cases
      const testCaseCount = await uploadTestCases(id, req.file.buffer, sampleCount);
      
      // Invalidate problem cache
      await invalidateCache(`problem:${id}`);
      
      res.status(201).json({
        message: 'Test cases uploaded successfully',
        testCasesCount: testCaseCount,
      });
    } catch (error) {
      return next(error);
    }
  }
);

export default router;
export { redisClient as problemCacheClient };
