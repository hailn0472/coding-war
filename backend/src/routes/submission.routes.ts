import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/authorize';
import {
  createSubmission,
  getSubmissionById,
  listSubmissions,
  rejudgeSubmission,
} from '../services/submissionService';
import {
  languageSchema,
  paginationSchema,
  uuidSchema,
} from '../utils/schemas';
import { SubmissionStatus } from '@prisma/client';

const router = Router();

/**
 * Validation Schemas
 */

const createSubmissionSchema = z.object({
  problemId: uuidSchema,
  language: languageSchema,
  sourceCode: z.string().min(1, 'Source code cannot be empty').max(65535, 'Source code is too long'),
  contestId: uuidSchema.optional(),
});

const listSubmissionsQuerySchema = paginationSchema.extend({
  userId: uuidSchema.optional(),
  problemId: uuidSchema.optional(),
  contestId: uuidSchema.optional(),
  status: z.nativeEnum(SubmissionStatus).optional(),
});

/**
 * POST /api/submissions
 * Create a new submission
 * Requirements: REQ-6.1
 */
router.post(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const data = createSubmissionSchema.parse(req.body);

      // Create submission
      const result = await createSubmission({
        userId: req.user!.userId,
        problemId: data.problemId,
        language: data.language,
        sourceCode: data.sourceCode,
        contestId: data.contestId,
      });

      res.status(201).json({
        submissionId: result.submissionId,
        status: 'queued',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(
          new AppError(400, 'VALIDATION_ERROR', 'Invalid submission data', error.errors)
        );
      }
      return next(error);
    }
  }
);

/**
 * GET /api/submissions/:id
 * Get submission details by ID
 * Requirements: REQ-6.7, REQ-6.8
 */
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate submission ID
      const submissionId = uuidSchema.parse(req.params.id);

      // Get submission
      const submission = await getSubmissionById(
        submissionId,
        req.user!.userId,
        req.user!.role
      );

      res.json(submission);
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

/**
 * GET /api/submissions
 * List submissions with filtering
 * Requirements: REQ-9.1, REQ-9.2, REQ-9.3, REQ-9.4
 */
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const query = listSubmissionsQuerySchema.parse(req.query);

      // List submissions
      const result = await listSubmissions(
        {
          userId: query.userId,
          problemId: query.problemId,
          contestId: query.contestId,
          status: query.status,
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

/**
 * POST /api/submissions/:id/rejudge
 * Rejudge a submission (Admin only)
 * Requirements: REQ-13.6, REQ-13.7
 */
router.post(
  '/:id/rejudge',
  authenticate,
  adminOnly,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate submission ID
      const submissionId = uuidSchema.parse(req.params.id);

      // Rejudge submission
      await rejudgeSubmission(submissionId);

      res.json({
        message: 'Submission queued for rejudging',
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
