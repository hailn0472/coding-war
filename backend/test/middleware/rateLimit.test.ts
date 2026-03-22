import { Request, Response } from 'express';

// Mock dependencies BEFORE importing the module
const mockRateLimitFn = jest.fn((_config) => {
  return jest.fn((_req, _res, next) => next());
});

jest.mock('express-rate-limit', () => mockRateLimitFn);
jest.mock('rate-limit-redis', () => jest.fn());
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
  })),
}));
jest.mock('../../src/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

// Import the module AFTER mocks are set up
import * as rateLimitModule from '../../src/../src/middleware/rateLimit';

describe('Rate Limit Middleware', () => {
  describe('Rate limiter configuration', () => {
    it('should create general rate limiter with correct config', () => {
      // Check that rateLimit was called with correct config
      const calls = mockRateLimitFn.mock.calls;
      const generalConfig = calls.find(call => call[0]?.max === 100)?.[0];
      
      expect(generalConfig).toBeDefined();
      expect(generalConfig.windowMs).toBe(60 * 1000);
      expect(generalConfig.max).toBe(100);
      expect(generalConfig.standardHeaders).toBe(true);
      expect(generalConfig.legacyHeaders).toBe(false);
    });

    it('should create submission rate limiter with correct config', () => {
      const calls = mockRateLimitFn.mock.calls;
      const submissionConfig = calls.find(call => call[0]?.max === 10)?.[0];
      
      expect(submissionConfig).toBeDefined();
      expect(submissionConfig.windowMs).toBe(60 * 1000);
      expect(submissionConfig.max).toBe(10);
    });

    it('should create login rate limiter with correct config', () => {
      const calls = mockRateLimitFn.mock.calls;
      const loginConfig = calls.find(call => call[0]?.max === 5)?.[0];
      
      expect(loginConfig).toBeDefined();
      expect(loginConfig.windowMs).toBe(60 * 1000);
      expect(loginConfig.max).toBe(5);
    });
  });

  describe('Rate limit handler', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
      jsonMock = jest.fn();
      statusMock = jest.fn().mockReturnValue({ json: jsonMock });

      mockRequest = {
        headers: { 'x-request-id': 'test-request-id' },
        ip: '127.0.0.1',
        path: '/api/test',
      };

      mockResponse = {
        status: statusMock,
        json: jsonMock,
      };
    });

    it('should return 429 status code when rate limit exceeded', () => {
      const calls = mockRateLimitFn.mock.calls;
      const generalConfig = calls.find(call => call[0]?.max === 100)?.[0];
      const handler = generalConfig?.handler;

      expect(handler).toBeDefined();
      handler(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(429);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        requestId: 'test-request-id',
        timestamp: expect.any(String),
      });
    });

    it('should include requestId in rate limit response', () => {
      const calls = mockRateLimitFn.mock.calls;
      const generalConfig = calls.find(call => call[0]?.max === 100)?.[0];
      const handler = generalConfig?.handler;

      handler(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'test-request-id',
        })
      );
    });

    it('should use "unknown" requestId when not provided', () => {
      mockRequest.headers = {};
      
      const calls = mockRateLimitFn.mock.calls;
      const generalConfig = calls.find(call => call[0]?.max === 100)?.[0];
      const handler = generalConfig?.handler;

      handler(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'unknown',
        })
      );
    });
  });

  describe('Submission rate limiter key generator', () => {
    it('should use userId when authenticated', () => {
      const calls = mockRateLimitFn.mock.calls;
      const submissionConfig = calls.find(call => call[0]?.max === 10)?.[0];

      const mockRequest = {
        user: { id: 'user-123' },
        ip: '127.0.0.1',
      } as any;

      const key = submissionConfig?.keyGenerator(mockRequest);
      expect(key).toBe('user-123');
    });

    it('should use IP when not authenticated', () => {
      const calls = mockRateLimitFn.mock.calls;
      const submissionConfig = calls.find(call => call[0]?.max === 10)?.[0];

      const mockRequest = {
        ip: '127.0.0.1',
      } as any;

      const key = submissionConfig?.keyGenerator(mockRequest);
      expect(key).toBe('127.0.0.1');
    });

    it('should use "unknown" when no userId or IP', () => {
      const calls = mockRateLimitFn.mock.calls;
      const submissionConfig = calls.find(call => call[0]?.max === 10)?.[0];

      const mockRequest = {} as any;

      const key = submissionConfig?.keyGenerator(mockRequest);
      expect(key).toBe('unknown');
    });
  });

  describe('Login rate limiter key generator', () => {
    it('should use IP address', () => {
      const calls = mockRateLimitFn.mock.calls;
      const loginConfig = calls.find(call => call[0]?.max === 5)?.[0];

      const mockRequest = {
        ip: '192.168.1.1',
      } as any;

      const key = loginConfig?.keyGenerator(mockRequest);
      expect(key).toBe('192.168.1.1');
    });

    it('should use "unknown" when no IP', () => {
      const calls = mockRateLimitFn.mock.calls;
      const loginConfig = calls.find(call => call[0]?.max === 5)?.[0];

      const mockRequest = {} as any;

      const key = loginConfig?.keyGenerator(mockRequest);
      expect(key).toBe('unknown');
    });
  });

  describe('Skip function', () => {
    it('should skip rate limiting for health check endpoints', () => {
      const calls = mockRateLimitFn.mock.calls;
      const generalConfig = calls.find(call => call[0]?.max === 100)?.[0];
      const skip = generalConfig?.skip;

      expect(skip).toBeDefined();
      expect(skip({ path: '/health' })).toBe(true);
      expect(skip({ path: '/api/health' })).toBe(true);
      expect(skip({ path: '/api/problems' })).toBe(false);
    });
  });

  describe('Module exports', () => {
    it('should export generalRateLimiter', () => {
      expect(rateLimitModule.generalRateLimiter).toBeDefined();
    });

    it('should export submissionRateLimiter', () => {
      expect(rateLimitModule.submissionRateLimiter).toBeDefined();
    });

    it('should export loginRateLimiter', () => {
      expect(rateLimitModule.loginRateLimiter).toBeDefined();
    });

    it('should export closeRateLimitRedis', () => {
      expect(rateLimitModule.closeRateLimitRedis).toBeDefined();
    });
  });
});
