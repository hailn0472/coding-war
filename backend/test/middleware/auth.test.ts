import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../../src/../src/middleware/auth';
import { verifyToken } from '../../src/../src/services/authService';

// Mock the authService
jest.mock('../../src/../src/services/authService');

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should attach user info to request when valid token is provided', () => {
      // Arrange
      const mockDecoded = { userId: 'user-123', role: 'USER' };
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };
      (verifyToken as jest.Mock).mockReturnValue(mockDecoded);

      // Act
      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(verifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual({
        userId: 'user-123',
        role: 'USER',
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should return 401 when Authorization header is missing', () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          code: 'AUTH_TOKEN_MISSING',
          message: 'Authorization header is required',
        })
      );
    });

    it('should return 401 when Authorization header format is invalid (missing Bearer)', () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'invalid-token',
      };

      // Act
      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          code: 'AUTH_INVALID_FORMAT',
        })
      );
    });

    it('should return 401 when Authorization header format is invalid (wrong scheme)', () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Basic token123',
      };

      // Act
      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          code: 'AUTH_INVALID_FORMAT',
        })
      );
    });

    it('should return 401 when token is invalid', () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };
      (verifyToken as jest.Mock).mockReturnValue(null);

      // Act
      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(verifyToken).toHaveBeenCalledWith('invalid-token');
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          code: 'AUTH_TOKEN_INVALID',
          message: 'Invalid or expired token',
        })
      );
    });

    it('should return 401 when token is expired', () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer expired-token',
      };
      (verifyToken as jest.Mock).mockReturnValue(null);

      // Act
      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          code: 'AUTH_TOKEN_INVALID',
        })
      );
    });

    it('should handle ADMIN role correctly', () => {
      // Arrange
      const mockDecoded = { userId: 'admin-123', role: 'ADMIN' };
      mockRequest.headers = {
        authorization: 'Bearer admin-token',
      };
      (verifyToken as jest.Mock).mockReturnValue(mockDecoded);

      // Act
      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockRequest.user).toEqual({
        userId: 'admin-123',
        role: 'ADMIN',
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle GUEST role correctly', () => {
      // Arrange
      const mockDecoded = { userId: 'guest-123', role: 'GUEST' };
      mockRequest.headers = {
        authorization: 'Bearer guest-token',
      };
      (verifyToken as jest.Mock).mockReturnValue(mockDecoded);

      // Act
      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockRequest.user).toEqual({
        userId: 'guest-123',
        role: 'GUEST',
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle token with extra whitespace', () => {
      // Arrange
      mockRequest.headers = {
        authorization: '  Bearer   valid-token  ',
      };
      (verifyToken as jest.Mock).mockReturnValue(null); // Will fail due to whitespace

      // Act
      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
        })
      );
    });

    it('should handle unexpected errors gracefully', () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };
      (verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      // Act
      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          code: 'AUTH_ERROR',
          message: 'Authentication failed',
        })
      );
    });
  });
});
