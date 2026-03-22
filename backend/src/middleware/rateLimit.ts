import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { logger } from '../utils/logger';

/**
 * Rate limiting middleware with Redis store
 * Validates: REQ-1.5
 */

// Create Redis client for rate limiting
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on('error', (err) => {
  logger.error('Redis rate limit client error', { error: err.message });
});

redisClient.on('connect', () => {
  logger.info('Redis rate limit client connected');
});

// Connect to Redis
redisClient.connect().catch((err) => {
  logger.error('Failed to connect Redis rate limit client', { error: err.message });
});

/**
 * General API rate limiter: 100 requests per minute
 * Validates: REQ-1.5
 */
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  store: new RedisStore({
    // @ts-expect-error - RedisStore types are not fully compatible
    client: redisClient,
    prefix: 'rl:general:',
  }),
  handler: (req, res) => {
    const requestId = req.headers['x-request-id'] as string || 'unknown';
    logger.warn('Rate limit exceeded', {
      requestId,
      ip: req.ip,
      path: req.path,
      limit: 'general',
    });
    
    res.status(429).json({
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
      requestId,
      timestamp: new Date().toISOString(),
    });
  },
  skip: (req) => {
    // Skip rate limiting for health check endpoints
    return req.path === '/health' || req.path === '/api/health';
  },
});

/**
 * Submission rate limiter: 10 requests per minute
 * Validates: REQ-1.5
 */
export const submissionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 submissions per window
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - RedisStore types are not fully compatible
    client: redisClient,
    prefix: 'rl:submission:',
  }),
  keyGenerator: (req) => {
    // Rate limit by user ID if authenticated, otherwise by IP
    const userId = (req as any).user?.id;
    return userId || req.ip || 'unknown';
  },
  handler: (req, res) => {
    const requestId = req.headers['x-request-id'] as string || 'unknown';
    const userId = (req as any).user?.id;
    
    logger.warn('Submission rate limit exceeded', {
      requestId,
      userId,
      ip: req.ip,
      path: req.path,
    });
    
    res.status(429).json({
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many submissions, please wait before submitting again',
      requestId,
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Login rate limiter: 5 requests per minute
 * Validates: REQ-1.5
 */
export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - RedisStore types are not fully compatible
    client: redisClient,
    prefix: 'rl:login:',
  }),
  keyGenerator: (req) => {
    // Rate limit by IP for login attempts
    return req.ip || 'unknown';
  },
  handler: (req, res) => {
    const requestId = req.headers['x-request-id'] as string || 'unknown';
    
    logger.warn('Login rate limit exceeded', {
      requestId,
      ip: req.ip,
      path: req.path,
    });
    
    res.status(429).json({
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts, please try again later',
      requestId,
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Cleanup function to close Redis connection
 */
export async function closeRateLimitRedis() {
  await redisClient.quit();
}
