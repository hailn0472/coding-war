import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { initializeExceptionHandlers, cleanupExceptionHandlers } from '../../src/../src/utils/exceptionHandler';
import { logger } from '../../src/../src/utils/logger';

// Mock the logger
jest.mock('../../src/../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Exception Handler', () => {
  let originalProcessOn: typeof process.on;
  let originalProcessRemoveListener: typeof process.removeListener;
  let uncaughtExceptionHandler: ((error: Error) => void) | null = null;
  let unhandledRejectionHandler: ((reason: any, promise: Promise<any>) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Store original process methods
    originalProcessOn = process.on;
    originalProcessRemoveListener = process.removeListener;
    
    // Mock process.on to capture handlers
    process.on = jest.fn((event: string, handler: any) => {
      if (event === 'uncaughtException') {
        uncaughtExceptionHandler = handler;
      } else if (event === 'unhandledRejection') {
        unhandledRejectionHandler = handler;
      }
      return process;
    }) as any;
    
    // Mock process.removeListener
    process.removeListener = jest.fn(() => process) as any;
  });

  afterEach(() => {
    // Restore original process methods
    process.on = originalProcessOn;
    process.removeListener = originalProcessRemoveListener;
    uncaughtExceptionHandler = null;
    unhandledRejectionHandler = null;
  });

  describe('initializeExceptionHandlers', () => {
    it('should register uncaughtException handler', () => {
      initializeExceptionHandlers();
      
      expect(process.on).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
      expect(logger.info).toHaveBeenCalledWith('Global exception handlers initialized');
    });

    it('should register unhandledRejection handler', () => {
      initializeExceptionHandlers();
      
      expect(process.on).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
    });

    it('should register SIGTERM handler', () => {
      initializeExceptionHandlers();
      
      expect(process.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    });

    it('should register SIGINT handler', () => {
      initializeExceptionHandlers();
      
      expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    });
  });

  describe('uncaughtException handler', () => {
    beforeEach(() => {
      initializeExceptionHandlers();
    });

    it('should log uncaught exception with full context', () => {
      const testError = new Error('Test uncaught exception');
      testError.stack = 'Error: Test uncaught exception\n    at test.js:1:1';
      
      if (uncaughtExceptionHandler) {
        uncaughtExceptionHandler(testError);
      }
      
      expect(logger.error).toHaveBeenCalledWith(
        'Uncaught Exception detected',
        expect.objectContaining({
          type: 'uncaughtException',
          error: 'Test uncaught exception',
          stack: expect.stringContaining('Error: Test uncaught exception'),
          name: 'Error',
          timestamp: expect.any(String),
        })
      );
    });

    it('should trigger administrator alert for uncaught exception', () => {
      const testError = new Error('Critical error');
      
      if (uncaughtExceptionHandler) {
        uncaughtExceptionHandler(testError);
      }
      
      // Check that critical alert was logged
      expect(logger.error).toHaveBeenCalledWith(
        'CRITICAL ERROR - Administrator alert triggered',
        expect.objectContaining({
          alert: true,
          severity: 'critical',
          type: 'uncaughtException',
          error: 'Critical error',
        })
      );
    });

    it('should include stack trace in error log', () => {
      const testError = new Error('Test error with stack');
      testError.stack = 'Error: Test error with stack\n    at Object.<anonymous> (test.js:10:15)';
      
      if (uncaughtExceptionHandler) {
        uncaughtExceptionHandler(testError);
      }
      
      expect(logger.error).toHaveBeenCalledWith(
        'Uncaught Exception detected',
        expect.objectContaining({
          stack: expect.stringContaining('test.js:10:15'),
        })
      );
    });
  });

  describe('unhandledRejection handler', () => {
    beforeEach(() => {
      initializeExceptionHandlers();
    });

    it('should log unhandled rejection with full context', () => {
      const testError = new Error('Test unhandled rejection');
      const testPromise = Promise.resolve(); // Use resolved promise to avoid actual rejection
      
      if (unhandledRejectionHandler) {
        unhandledRejectionHandler(testError, testPromise);
      }
      
      expect(logger.error).toHaveBeenCalledWith(
        'Unhandled Promise Rejection detected',
        expect.objectContaining({
          type: 'unhandledRejection',
          error: 'Test unhandled rejection',
          stack: expect.any(String),
          reason: 'Error: Test unhandled rejection',
          timestamp: expect.any(String),
        })
      );
    });

    it('should handle non-Error rejection reasons', () => {
      const testPromise = Promise.resolve(); // Use resolved promise
      
      if (unhandledRejectionHandler) {
        unhandledRejectionHandler('String rejection reason', testPromise);
      }
      
      expect(logger.error).toHaveBeenCalledWith(
        'Unhandled Promise Rejection detected',
        expect.objectContaining({
          type: 'unhandledRejection',
          reason: 'String rejection reason',
        })
      );
    });

    it('should trigger administrator alert for unhandled rejection', () => {
      const testError = new Error('Critical promise rejection');
      const testPromise = Promise.resolve(); // Use resolved promise
      
      if (unhandledRejectionHandler) {
        unhandledRejectionHandler(testError, testPromise);
      }
      
      // Check that critical alert was logged
      expect(logger.error).toHaveBeenCalledWith(
        'CRITICAL ERROR - Administrator alert triggered',
        expect.objectContaining({
          alert: true,
          severity: 'critical',
          type: 'unhandledRejection',
          error: 'Critical promise rejection',
        })
      );
    });

    it('should include stack trace for Error rejections', () => {
      const testError = new Error('Promise error with stack');
      testError.stack = 'Error: Promise error with stack\n    at async function (async.js:5:10)';
      const testPromise = Promise.resolve(); // Use resolved promise
      
      if (unhandledRejectionHandler) {
        unhandledRejectionHandler(testError, testPromise);
      }
      
      expect(logger.error).toHaveBeenCalledWith(
        'Unhandled Promise Rejection detected',
        expect.objectContaining({
          stack: expect.stringContaining('async.js:5:10'),
        })
      );
    });
  });

  describe('cleanupExceptionHandlers', () => {
    it('should remove uncaughtException handler', () => {
      initializeExceptionHandlers();
      cleanupExceptionHandlers();
      
      expect(process.removeListener).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
    });

    it('should remove unhandledRejection handler', () => {
      initializeExceptionHandlers();
      cleanupExceptionHandlers();
      
      expect(process.removeListener).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
    });
  });

  describe('error context', () => {
    beforeEach(() => {
      initializeExceptionHandlers();
    });

    it('should include timestamp in ISO format', () => {
      const testError = new Error('Test error');
      
      if (uncaughtExceptionHandler) {
        uncaughtExceptionHandler(testError);
      }
      
      expect(logger.error).toHaveBeenCalledWith(
        'Uncaught Exception detected',
        expect.objectContaining({
          timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        })
      );
    });

    it('should include error name', () => {
      const testError = new TypeError('Type error test');
      
      if (uncaughtExceptionHandler) {
        uncaughtExceptionHandler(testError);
      }
      
      expect(logger.error).toHaveBeenCalledWith(
        'Uncaught Exception detected',
        expect.objectContaining({
          name: 'TypeError',
        })
      );
    });
  });

  describe('administrator alerting', () => {
    beforeEach(() => {
      initializeExceptionHandlers();
    });

    it('should log alert with critical severity', () => {
      const testError = new Error('Critical system error');
      
      if (uncaughtExceptionHandler) {
        uncaughtExceptionHandler(testError);
      }
      
      expect(logger.error).toHaveBeenCalledWith(
        'CRITICAL ERROR - Administrator alert triggered',
        expect.objectContaining({
          alert: true,
          severity: 'critical',
        })
      );
    });

    it('should include full error details in alert', () => {
      const testError = new Error('Alert test error');
      testError.stack = 'Error: Alert test error\n    at test.js:100:50';
      
      if (uncaughtExceptionHandler) {
        uncaughtExceptionHandler(testError);
      }
      
      expect(logger.error).toHaveBeenCalledWith(
        'CRITICAL ERROR - Administrator alert triggered',
        expect.objectContaining({
          error: 'Alert test error',
          stack: expect.stringContaining('test.js:100:50'),
          type: 'uncaughtException',
        })
      );
    });
  });
});
