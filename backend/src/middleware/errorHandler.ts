import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ErrorResponse } from '../types';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

/**
 * Custom application error class
 * Validates: REQ-1.3, REQ-1.4, REQ-17.1, REQ-17.2
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handling middleware
 * Catches all unhandled exceptions and converts them to standardized error responses
 * Validates: REQ-1.3, REQ-1.4, REQ-17.1, REQ-17.2, REQ-17.3, REQ-17.4, REQ-17.5, REQ-17.6, REQ-17.7
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] as string || 'unknown';
  const userId = (req as any).user?.id;
  const endpoint = `${req.method} ${req.path}`;
  
  // Determine if this is a critical error (5xx)
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const isCritical = statusCode >= 500;
  
  // Log error with full context including stack trace, requestId, userId, endpoint
  logger.error('Error occurred', {
    requestId,
    userId,
    endpoint,
    method: req.method,
    path: req.path,
    url: req.originalUrl,
    error: err.message,
    errorName: err.name,
    stack: err.stack,
    statusCode,
    isCritical,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('user-agent'),
    body: req.body,
    query: req.query,
    params: req.params,
  });

  // Alert administrators for critical errors (500 errors)
  if (isCritical) {
    logger.error('CRITICAL ERROR - Administrator alert triggered', {
      alert: true,
      severity: 'critical',
      requestId,
      userId,
      endpoint,
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
    });
    
    // TODO: Integrate with actual alerting mechanisms:
    // - Send email to administrators
    // - Post to Slack/Discord channel
    // - Trigger PagerDuty incident
  }

  // Handle known AppError instances
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      code: err.code,
      message: err.message,
      details: err.details,
      requestId,
      timestamp: new Date().toISOString(),
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle Zod validation errors (422)
  if (err instanceof ZodError) {
    const response: ErrorResponse = {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
      requestId,
      timestamp: new Date().toISOString(),
    };
    res.status(422).json(response);
    return;
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (err.code === 'P2002') {
      const response: ErrorResponse = {
        code: 'CONFLICT',
        message: 'Resource already exists',
        details: { fields: err.meta?.target },
        requestId,
        timestamp: new Date().toISOString(),
      };
      res.status(409).json(response);
      return;
    }
    
    // Foreign key constraint violation
    if (err.code === 'P2003') {
      const response: ErrorResponse = {
        code: 'BAD_REQUEST',
        message: 'Invalid reference to related resource',
        requestId,
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }
    
    // Record not found
    if (err.code === 'P2025') {
      const response: ErrorResponse = {
        code: 'NOT_FOUND',
        message: 'Resource not found',
        requestId,
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(response);
      return;
    }
  }

  // Handle Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    const response: ErrorResponse = {
      code: 'BAD_REQUEST',
      message: 'Invalid data provided',
      requestId,
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(response);
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    const response: ErrorResponse = {
      code: 'UNAUTHORIZED',
      message: 'Invalid authentication token',
      requestId,
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(response);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    const response: ErrorResponse = {
      code: 'UNAUTHORIZED',
      message: 'Authentication token has expired',
      requestId,
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(response);
    return;
  }

  // Handle unknown errors (500)
  const response: ErrorResponse = {
    code: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    requestId,
    timestamp: new Date().toISOString(),
  };
  
  res.status(500).json(response);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
