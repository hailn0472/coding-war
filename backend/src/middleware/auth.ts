import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';
import { AppError } from './errorHandler';

// Extend Express Request type to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Validates JWT token from Authorization header and attaches user info to request
 * Requirements: REQ-3.10, REQ-3.11
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AppError(401, 'AUTH_TOKEN_MISSING', 'Authorization header is required');
    }

    // Check Bearer format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AppError(401, 'AUTH_INVALID_FORMAT', 'Authorization header must be in format: Bearer <token>');
    }

    const token = parts[1];

    // Validate and decode token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      throw new AppError(401, 'AUTH_TOKEN_INVALID', 'Invalid or expired token');
    }

    // Attach user info to request object
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(401, 'AUTH_ERROR', 'Authentication failed'));
    }
  }
}

/**
 * Optional authentication middleware
 * Validates JWT token if present, but doesn't fail if missing
 * Used for endpoints that show different content based on auth status
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      // No auth header, continue without user info
      next();
      return;
    }

    // Check Bearer format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      // Invalid format, continue without user info
      next();
      return;
    }

    const token = parts[1];

    // Validate and decode token
    const decoded = verifyToken(token);
    
    if (decoded) {
      // Attach user info to request object
      req.user = {
        userId: decoded.userId,
        role: decoded.role,
      };
    }

    next();
  } catch (error) {
    // On any error, just continue without user info
    next();
  }
}
