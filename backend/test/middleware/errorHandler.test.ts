import { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError, asyncHandler } from '../../src/../src/middleware/errorHandler';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../../src/../src/utils/logger';

// Mock logger
jest.mock('../../src/../src/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      headers: { 'x-request-id': 'test-request-id' },
      path: '/test',
      method: 'GET',
      get: jest.fn().mockReturnValue(undefined),
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('AppError handling', () => {
    it('should handle AppError with correct status code and response format', () => {
      const error = new AppError(400, 'BAD_REQUEST', 'Invalid input', { field: 'username' });
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'BAD_REQUEST',
        message: 'Invalid input',
        details: { field: 'username' },
        requestId: 'test-request-id',
        timestamp: expect.any(String),
      });
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle AppError without details', () => {
      const error = new AppError(404, 'NOT_FOUND', 'Resource not found');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'NOT_FOUND',
        message: 'Resource not found',
        details: undefined,
        requestId: 'test-request-id',
        timestamp: expect.any(String),
      });
    });

    it('should handle 401 Unauthorized', () => {
      const error = new AppError(401, 'UNAUTHORIZED', 'Invalid token');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        code: 'UNAUTHORIZED',
        message: 'Invalid token',
      }));
    });

    it('should handle 403 Forbidden', () => {
      const error = new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      }));
    });

    it('should handle 422 Validation Error', () => {
      const error = new AppError(422, 'VALIDATION_ERROR', 'Invalid data');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(422);
    });

    it('should handle 429 Rate Limit Exceeded', () => {
      const error = new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(429);
    });

    it('should handle 503 Service Unavailable', () => {
      const error = new AppError(503, 'SERVICE_UNAVAILABLE', 'Service temporarily unavailable');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(503);
    });
  });

  describe('ZodError handling', () => {
    it('should handle ZodError with field-specific errors', () => {
      const schema = z.object({
        username: z.string().min(3),
        email: z.string().email(),
      });
      
      try {
        schema.parse({ username: 'ab', email: 'invalid' });
      } catch (error) {
        errorHandler(error as Error, mockRequest as Request, mockResponse as Response, mockNext);
        
        expect(statusMock).toHaveBeenCalledWith(422);
        expect(jsonMock).toHaveBeenCalledWith({
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: expect.any(String),
              message: expect.any(String),
            }),
          ]),
          requestId: 'test-request-id',
          timestamp: expect.any(String),
        });
      }
    });
  });

  describe('Prisma error handling', () => {
    it('should handle unique constraint violation (P2002)', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0',
        meta: { target: ['email'] },
      });
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'CONFLICT',
        message: 'Resource already exists',
        details: { fields: ['email'] },
        requestId: 'test-request-id',
        timestamp: expect.any(String),
      });
    });

    it('should handle foreign key constraint violation (P2003)', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
        code: 'P2003',
        clientVersion: '5.0.0',
      });
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'BAD_REQUEST',
        message: 'Invalid reference to related resource',
        requestId: 'test-request-id',
        timestamp: expect.any(String),
      });
    });

    it('should handle record not found (P2025)', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      });
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'NOT_FOUND',
        message: 'Resource not found',
        requestId: 'test-request-id',
        timestamp: expect.any(String),
      });
    });

    it('should handle Prisma validation error', () => {
      const error = new Prisma.PrismaClientValidationError('Validation failed', {
        clientVersion: '5.0.0',
      });
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'BAD_REQUEST',
        message: 'Invalid data provided',
        requestId: 'test-request-id',
        timestamp: expect.any(String),
      });
    });
  });

  describe('JWT error handling', () => {
    it('should handle JsonWebTokenError', () => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'UNAUTHORIZED',
        message: 'Invalid authentication token',
        requestId: 'test-request-id',
        timestamp: expect.any(String),
      });
    });

    it('should handle TokenExpiredError', () => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'UNAUTHORIZED',
        message: 'Authentication token has expired',
        requestId: 'test-request-id',
        timestamp: expect.any(String),
      });
    });
  });

  describe('Unknown error handling', () => {
    it('should handle unknown errors in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Something went wrong');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        requestId: 'test-request-id',
        timestamp: expect.any(String),
      });
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should expose error message in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Detailed error message');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Detailed error message',
        requestId: 'test-request-id',
        timestamp: expect.any(String),
      });
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Request ID handling', () => {
    it('should use default request ID when not provided', () => {
      mockRequest.headers = {};
      const error = new AppError(400, 'BAD_REQUEST', 'Test error');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        requestId: 'unknown',
      }));
    });
  });

  describe('Logging', () => {
    it('should log error with stack trace', () => {
      const error = new Error('Test error');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith('Error occurred', expect.objectContaining({
        requestId: 'test-request-id',
        userId: undefined,
        endpoint: 'GET /test',
        method: 'GET',
        path: '/test',
        error: 'Test error',
        errorName: 'Error',
        stack: expect.any(String),
        statusCode: 500,
        isCritical: true,
      }));
    });

    it('should log userId if available', () => {
      (mockRequest as any).user = { id: 'user-123' };
      const error = new Error('Test error');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith('Error occurred', expect.objectContaining({
        userId: 'user-123',
      }));
    });

    it('should log full context including endpoint, url, and request details', () => {
      mockRequest.originalUrl = '/test?query=value';
      (mockRequest as any).ip = '127.0.0.1';
      mockRequest.body = { field: 'value' };
      mockRequest.query = { query: 'value' };
      mockRequest.params = { id: '123' };
      mockRequest.get = jest.fn().mockReturnValue('Mozilla/5.0');
      
      const error = new Error('Test error');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith('Error occurred', expect.objectContaining({
        requestId: 'test-request-id',
        endpoint: 'GET /test',
        url: '/test?query=value',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        body: { field: 'value' },
        query: { query: 'value' },
        params: { id: '123' },
      }));
    });

    it('should include timestamp in ISO format', () => {
      const error = new Error('Test error');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith('Error occurred', expect.objectContaining({
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      }));
    });

    it('should include error name', () => {
      const error = new TypeError('Type error');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith('Error occurred', expect.objectContaining({
        errorName: 'TypeError',
      }));
    });
  });

  describe('Critical error alerting', () => {
    it('should trigger alert for 500 errors', () => {
      const error = new Error('Internal server error');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith(
        'CRITICAL ERROR - Administrator alert triggered',
        expect.objectContaining({
          alert: true,
          severity: 'critical',
          requestId: 'test-request-id',
          endpoint: 'GET /test',
          error: 'Internal server error',
          stack: expect.any(String),
        })
      );
    });

    it('should trigger alert for AppError with 500 status', () => {
      const error = new AppError(500, 'INTERNAL_ERROR', 'Critical system failure');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith(
        'CRITICAL ERROR - Administrator alert triggered',
        expect.objectContaining({
          alert: true,
          severity: 'critical',
        })
      );
    });

    it('should trigger alert for AppError with 503 status', () => {
      const error = new AppError(503, 'SERVICE_UNAVAILABLE', 'Service down');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith(
        'CRITICAL ERROR - Administrator alert triggered',
        expect.objectContaining({
          alert: true,
          severity: 'critical',
        })
      );
    });

    it('should NOT trigger alert for 4xx errors', () => {
      const error = new AppError(400, 'BAD_REQUEST', 'Invalid input');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Should log error but not critical alert
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith('Error occurred', expect.any(Object));
    });

    it('should include userId in critical alert if available', () => {
      (mockRequest as any).user = { id: 'user-456' };
      const error = new Error('Critical error');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith(
        'CRITICAL ERROR - Administrator alert triggered',
        expect.objectContaining({
          userId: 'user-456',
        })
      );
    });

    it('should mark error as critical in log context', () => {
      const error = new Error('Server error');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith('Error occurred', expect.objectContaining({
        isCritical: true,
        statusCode: 500,
      }));
    });

    it('should mark 4xx errors as non-critical', () => {
      const error = new AppError(404, 'NOT_FOUND', 'Resource not found');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith('Error occurred', expect.objectContaining({
        isCritical: false,
        statusCode: 404,
      }));
    });
  });

  describe('asyncHandler', () => {
    it('should catch async errors and pass to next', async () => {
      const error = new Error('Async error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const handler = asyncHandler(asyncFn);
      
      await handler(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle successful async operations', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success');
      const handler = asyncHandler(asyncFn);
      
      await handler(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(asyncFn).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
