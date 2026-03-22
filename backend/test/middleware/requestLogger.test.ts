import { Request, Response, NextFunction } from 'express';
import { requestLogger } from '../../src/../src/middleware/requestLogger';
import { logger } from '../../src/../src/utils/logger';

jest.mock('../../src/../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Request Logger Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let sendMock: jest.Mock;

  beforeEach(() => {
    sendMock = jest.fn();
    
    mockRequest = {
      headers: { 'x-request-id': 'test-request-id' },
      method: 'GET',
      path: '/api/problems',
      originalUrl: '/api/problems?page=1',
      ip: '127.0.0.1',
      get: jest.fn((header: string) => {
        if (header === 'user-agent') return 'Mozilla/5.0';
        return undefined;
      }) as any,
    };
    
    mockResponse = {
      send: sendMock,
      statusCode: 200,
    };
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });

  it('should log incoming request with all details', () => {
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

    expect(logger.info).toHaveBeenCalledWith('Incoming request', {
      requestId: 'test-request-id',
      method: 'GET',
      endpoint: '/api/problems',
      url: '/api/problems?page=1',
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      userId: undefined,
      timestamp: expect.any(String),
    });
    expect(mockNext).toHaveBeenCalled();
  });

  it('should log userId when user is authenticated', () => {
    (mockRequest as any).user = { id: 'user-123' };

    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

    expect(logger.info).toHaveBeenCalledWith('Incoming request', 
      expect.objectContaining({
        userId: 'user-123',
      })
    );
  });

  it('should log outgoing response when send is called', () => {
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

    // Simulate response being sent
    mockResponse.send!('response data');

    expect(logger.info).toHaveBeenCalledWith('Outgoing response', {
      requestId: 'test-request-id',
      method: 'GET',
      endpoint: '/api/problems',
      statusCode: 200,
      duration: expect.stringMatching(/^\d+ms$/),
      userId: undefined,
      timestamp: expect.any(String),
    });
  });

  it('should measure response duration', (done) => {
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

    // Wait a bit before sending response
    setTimeout(() => {
      mockResponse.send!('response data');

      const outgoingLog = (logger.info as jest.Mock).mock.calls.find(
        call => call[0] === 'Outgoing response'
      );
      
      expect(outgoingLog).toBeDefined();
      const duration = outgoingLog[1].duration;
      expect(duration).toMatch(/^\d+ms$/);
      
      // Duration should be at least 10ms
      const durationValue = parseInt(duration.replace('ms', ''));
      expect(durationValue).toBeGreaterThanOrEqual(10);
      
      done();
    }, 10);
  });

  it('should log different status codes', () => {
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

    mockResponse.statusCode = 404;
    mockResponse.send!('Not found');

    expect(logger.info).toHaveBeenCalledWith('Outgoing response',
      expect.objectContaining({
        statusCode: 404,
      })
    );
  });

  it('should handle missing request ID', () => {
    mockRequest.headers = {};

    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

    expect(logger.info).toHaveBeenCalledWith('Incoming request',
      expect.objectContaining({
        requestId: 'unknown',
      })
    );
  });

  it('should handle missing user agent', () => {
    mockRequest.get = jest.fn(() => undefined);

    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

    expect(logger.info).toHaveBeenCalledWith('Incoming request',
      expect.objectContaining({
        userAgent: undefined,
      })
    );
  });

  it('should preserve original send functionality', () => {
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

    const testData = { message: 'test' };
    mockResponse.send!(testData);

    expect(sendMock).toHaveBeenCalledWith(testData);
  });

  it('should log POST requests', () => {
    Object.assign(mockRequest, {
      method: 'POST',
      path: '/api/submissions',
    });

    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

    expect(logger.info).toHaveBeenCalledWith('Incoming request',
      expect.objectContaining({
        method: 'POST',
        endpoint: '/api/submissions',
      })
    );
  });

  it('should log error status codes', () => {
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

    mockResponse.statusCode = 500;
    mockResponse.send!({ error: 'Internal server error' });

    expect(logger.info).toHaveBeenCalledWith('Outgoing response',
      expect.objectContaining({
        statusCode: 500,
      })
    );
  });

  it('should handle multiple requests independently', () => {
    const mockRequest2: Partial<Request> = {
      headers: { 'x-request-id': 'request-2' },
      method: 'POST',
      path: '/api/auth/login',
      originalUrl: '/api/auth/login',
      ip: '192.168.1.1',
      get: jest.fn(() => 'Chrome') as any,
    };

    const mockResponse2: Partial<Response> = {
      send: jest.fn(),
      statusCode: 201,
    };

    // First request
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
    
    // Second request
    requestLogger(mockRequest2 as Request, mockResponse2 as Response, mockNext);

    // Both should be logged
    expect(logger.info).toHaveBeenCalledWith('Incoming request',
      expect.objectContaining({ requestId: 'test-request-id' })
    );
    expect(logger.info).toHaveBeenCalledWith('Incoming request',
      expect.objectContaining({ requestId: 'request-2' })
    );
  });
});
