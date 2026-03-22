import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

/**
 * Role hierarchy: ADMIN > USER > GUEST
 */
const ROLE_HIERARCHY: Record<string, number> = {
  ADMIN: 3,
  USER: 2,
  GUEST: 1,
};

/**
 * Authorization middleware factory
 * Creates middleware that checks if user has required role
 * Requirements: REQ-4.2, REQ-4.3, REQ-4.4, REQ-4.5, REQ-4.6, REQ-4.7
 * 
 * @param allowedRoles - Array of roles that can access the endpoint
 * @returns Express middleware function
 */
export function authorize(allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        throw new AppError(401, 'AUTH_REQUIRED', 'Authentication required');
      }

      const { userId, role } = req.user;
      const userRoleLevel = ROLE_HIERARCHY[role] || 0;

      // Check if user role is allowed
      const hasPermission = allowedRoles.some(allowedRole => {
        const allowedRoleLevel = ROLE_HIERARCHY[allowedRole] || 0;
        return userRoleLevel >= allowedRoleLevel;
      });

      if (!hasPermission) {
        // Log authorization failure for security auditing (REQ-4.7)
        logger.warn('Authorization failed', {
          userId,
          role,
          path: req.path,
          method: req.method,
          allowedRoles,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          requestId: req.headers['x-request-id'],
        });

        throw new AppError(
          403,
          'AUTH_INSUFFICIENT_PERMISSIONS',
          'You do not have permission to access this resource'
        );
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError(403, 'AUTH_ERROR', 'Authorization failed'));
      }
    }
  };
}

/**
 * Convenience middleware for common role combinations
 */

// Admin only
export const adminOnly = authorize(['ADMIN']);

// Admin and User
export const userAndAbove = authorize(['USER', 'ADMIN']);

// All authenticated users (including Guest)
export const authenticated = authorize(['GUEST', 'USER', 'ADMIN']);
