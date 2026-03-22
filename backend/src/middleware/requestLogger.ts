import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Request logging middleware
 * Logs all requests with method, endpoint, userId, timestamp, and requestId
 * Validates: REQ-1.6, REQ-17.5, REQ-17.6
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] as string || 'unknown';
  const startTime = Date.now();
  
  // Log incoming request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    endpoint: req.path,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: (req as any).user?.id,
    timestamp: new Date().toISOString(),
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any) {
    const duration = Date.now() - startTime;
    
    // Log response
    logger.info('Outgoing response', {
      requestId,
      method: req.method,
      endpoint: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: (req as any).user?.id,
      timestamp: new Date().toISOString(),
    });
    
    return originalSend.call(this, data);
  };

  next();
}
