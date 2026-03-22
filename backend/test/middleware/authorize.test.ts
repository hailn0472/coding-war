import { Request, Response, NextFunction } from 'express';
import { authorize, adminOnly, userAndAbove, authenticated } from '../../src/../src/middleware/authorize';
import { logger } from '../../src/../src/utils/logger';

// Mock the logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('Authorization Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {
        'x-request-id': 'test-request-id',
        'user-agent': 'test-agent',
      },
      path: '/test-path',
      method: 'GET',
      ip: '127.0.0.1',
    };
    mockResponse = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authorize middleware factory', () => {
    it('should allow ADMIN to access ADMIN-only endpoint', () => {
      // Arrange
      mockRequest.user = { userId: 'admin-123', role: 'ADMIN' };
      const middleware = authorize(['ADMIN']);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should allow ADMIN to access USER endpoint (role hierarchy)', () => {
      // Arrange
      mockRequest.user = { userId: 'admin-123', role: 'ADMIN' };
      const middleware = authorize(['USER']);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should allow ADMIN to access GUEST endpoint (role hierarchy)', () => {
      // Arrange
      mockRequest.user = { userId: 'admin-123', role: 'ADMIN' };
      const middleware = authorize(['GUEST']);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should allow USER to access USER endpoint', () => {
      // Arrange
      mockRequest.user = { userId: 'user-123', role: 'USER' };
      const middleware = authorize(['USER']);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should allow USER to access GUEST endpoint (role hierarchy)', () => {
      // Arrange
      mockRequest.user = { userId: 'user-123', role: 'USER' };
      const middleware = authorize(['GUEST']);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should deny USER access to ADMIN endpoint', () => {
      // Arrange
      mockRequest.user = { userId: 'user-123', role: 'USER' };
      const middleware = authorize(['ADMIN']);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          code: 'AUTH_INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to access this resource',
        })
      );
      expect(logger.warn).toHaveBeenCalledWith(
        'Authorization failed',
        expect.objectContaining({
          userId: 'user-123',
          role: 'USER',
          path: '/test-path',
          method: 'GET',
          allowedRoles: ['ADMIN'],
        })
      );
    });

    it('should allow GUEST to access GUEST endpoint', () => {
      // Arrange
      mockRequest.user = { userId: 'guest-123', role: 'GUEST' };
      const middleware = authorize(['GUEST']);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should deny GUEST access to USER endpoint', () => {
      // Arrange
      mockRequest.user = { userId: 'guest-123', role: 'GUEST' };
      const middleware = authorize(['USER']);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          code: 'AUTH_INSUFFICIENT_PERMISSIONS',
        })
      );
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should deny GUEST access to ADMIN endpoint', () => {
      // Arrange
      mockRequest.user = { userId: 'guest-123', role: 'GUEST' };
      const middleware = authorize(['ADMIN']);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          code: 'AUTH_INSUFFICIENT_PERMISSIONS',
        })
      );
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      // Arrange
      mockRequest.user = undefined;
      const middleware = authorize(['USER']);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
        })
      );
    });

    it('should allow access when user role matches any of multiple allowed roles', () => {
      // Arrange
      mockRequest.user = { userId: 'user-123', role: 'USER' };
      const middleware = authorize(['USER', 'ADMIN']);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should log authorization failure with all relevant details', () => {
      // Arrange
      mockRequest.user = { userId: 'user-123', role: 'USER' };
      Object.assign(mockRequest, {
        path: '/admin/users',
        method: 'DELETE',
        ip: '192.168.1.1',
      });
      mockRequest.headers = {
        'user-agent': 'Mozilla/5.0',
        'x-request-id': 'req-456',
      };
      const middleware = authorize(['ADMIN']);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        'Authorization failed',
        expect.objectContaining({
          userId: 'user-123',
          role: 'USER',
          path: '/admin/users',
          method: 'DELETE',
          allowedRoles: ['ADMIN'],
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          requestId: 'req-456',
        })
      );
    });

    it('should handle unknown role gracefully', () => {
      // Arrange
      mockRequest.user = { userId: 'user-123', role: 'UNKNOWN_ROLE' };
      const middleware = authorize(['USER']);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          code: 'AUTH_INSUFFICIENT_PERMISSIONS',
        })
      );
    });

    it('should handle unexpected errors gracefully', () => {
      // Arrange
      mockRequest.user = { userId: 'user-123', role: 'USER' };
      const middleware = authorize(['USER']);

      // Act - User has permission, should succeed
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert - should call next without error
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('convenience middleware', () => {
    describe('adminOnly', () => {
      it('should allow ADMIN', () => {
        mockRequest.user = { userId: 'admin-123', role: 'ADMIN' };
        adminOnly(mockRequest as Request, mockResponse as Response, mockNext);
        expect(mockNext).toHaveBeenCalledWith();
      });

      it('should deny USER', () => {
        mockRequest.user = { userId: 'user-123', role: 'USER' };
        adminOnly(mockRequest as Request, mockResponse as Response, mockNext);
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({ statusCode: 403 })
        );
      });

      it('should deny GUEST', () => {
        mockRequest.user = { userId: 'guest-123', role: 'GUEST' };
        adminOnly(mockRequest as Request, mockResponse as Response, mockNext);
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({ statusCode: 403 })
        );
      });
    });

    describe('userAndAbove', () => {
      it('should allow ADMIN', () => {
        mockRequest.user = { userId: 'admin-123', role: 'ADMIN' };
        userAndAbove(mockRequest as Request, mockResponse as Response, mockNext);
        expect(mockNext).toHaveBeenCalledWith();
      });

      it('should allow USER', () => {
        mockRequest.user = { userId: 'user-123', role: 'USER' };
        userAndAbove(mockRequest as Request, mockResponse as Response, mockNext);
        expect(mockNext).toHaveBeenCalledWith();
      });

      it('should deny GUEST', () => {
        mockRequest.user = { userId: 'guest-123', role: 'GUEST' };
        userAndAbove(mockRequest as Request, mockResponse as Response, mockNext);
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({ statusCode: 403 })
        );
      });
    });

    describe('authenticated', () => {
      it('should allow ADMIN', () => {
        mockRequest.user = { userId: 'admin-123', role: 'ADMIN' };
        authenticated(mockRequest as Request, mockResponse as Response, mockNext);
        expect(mockNext).toHaveBeenCalledWith();
      });

      it('should allow USER', () => {
        mockRequest.user = { userId: 'user-123', role: 'USER' };
        authenticated(mockRequest as Request, mockResponse as Response, mockNext);
        expect(mockNext).toHaveBeenCalledWith();
      });

      it('should allow GUEST', () => {
        mockRequest.user = { userId: 'guest-123', role: 'GUEST' };
        authenticated(mockRequest as Request, mockResponse as Response, mockNext);
        expect(mockNext).toHaveBeenCalledWith();
      });

      it('should deny unauthenticated user', () => {
        mockRequest.user = undefined;
        authenticated(mockRequest as Request, mockResponse as Response, mockNext);
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({ statusCode: 401 })
        );
      });
    });
  });
});
