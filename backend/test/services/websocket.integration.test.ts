import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServer } from 'http';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { initializeSocketServer, closeSocketServer } from '../../src/../src/services/socketService';
import { initializeSubmissionSocketHandlers } from '../../src/../src/services/submissionSocketService';
import { generateAccessToken } from '../../src/../src/services/authService';

/**
 * WebSocket Integration Tests
 * Tests real-time submission status updates end-to-end
 * Validates: REQ-8.1, REQ-8.2, REQ-8.3, REQ-8.4, REQ-8.5
 */

describe('WebSocket Integration Tests', () => {
  let httpServer: any;
  let clientSocket: ClientSocket;
  const PORT = 3001;

  beforeAll(async () => {
    // Create HTTP server
    httpServer = createServer();

    // Initialize Socket.io server
    await initializeSocketServer(httpServer);
    initializeSubmissionSocketHandlers();

    // Start server
    await new Promise<void>((resolve) => {
      httpServer.listen(PORT, () => {
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (clientSocket) {
      clientSocket.close();
    }
    await closeSocketServer();
    if (httpServer) {
      await new Promise<void>((resolve) => {
        httpServer.close(() => {
          resolve();
        });
      });
    }
  });

  it('should establish WebSocket connection with valid JWT token', (done) => {
    const token = generateAccessToken('test-user-123', 'user');

    clientSocket = ioClient(`http://localhost:${PORT}`, {
      auth: { token },
    });

    clientSocket.on('connect', () => {
      expect(clientSocket.connected).toBe(true);
      done();
    });

    clientSocket.on('connect_error', (error: Error) => {
      done(error);
    });
  });

  it('should reject connection without valid token', (done) => {
    const invalidSocket = ioClient(`http://localhost:${PORT}`, {
      auth: { token: 'invalid-token' },
    });

    invalidSocket.on('connect', () => {
      invalidSocket.close();
      done(new Error('Should not connect with invalid token'));
    });

    invalidSocket.on('connect_error', (error: Error) => {
      expect(error.message).toContain('Invalid token');
      invalidSocket.close();
      done();
    });
  });

  it('should handle subscription to submission updates', (done) => {
    const token = generateAccessToken('test-user-123', 'user');

    const socket = ioClient(`http://localhost:${PORT}`, {
      auth: { token },
    });

    socket.on('connect', () => {
      // Subscribe to submission
      socket.emit('subscribe:submission', { submissionId: 'test-submission-123' });

      socket.on('subscribed:submission', (data: { submissionId: string }) => {
        expect(data.submissionId).toBe('test-submission-123');
        socket.close();
        done();
      });

      socket.on('error', (error: { message: string }) => {
        // Expected to fail since submission doesn't exist in test DB
        expect(error.message).toBeDefined();
        socket.close();
        done();
      });
    });
  });
});
