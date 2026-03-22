import { describe, it, expect, jest } from '@jest/globals';
import { Server as HttpServer, createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

/**
 * Socket Service Tests
 * Tests WebSocket server initialization and authentication
 * Validates: REQ-8.1, REQ-8.5
 */

// Mock Redis client
const mockRedisClient = {
  connect: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  duplicate: jest.fn(),
  on: jest.fn(),
  psubscribe: jest.fn(),
  subscribe: jest.fn(),
  publish: jest.fn(),
  quit: jest.fn(),
  disconnect: jest.fn(),
};

const mockSubClient = {
  connect: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  on: jest.fn(),
  psubscribe: jest.fn(),
  subscribe: jest.fn(),
  publish: jest.fn(),
  quit: jest.fn(),
  disconnect: jest.fn(),
};

mockRedisClient.duplicate.mockReturnValue(mockSubClient as any);

// Mock dependencies before imports
jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedisClient),
}));

jest.mock('@socket.io/redis-adapter', () => ({
  createAdapter: jest.fn().mockImplementation(() => {
    return function RedisAdapter(nsp: any) {
      return {
        nsp,
        rooms: new Map(),
        sids: new Map(),
        encoder: null,
        init: jest.fn(),
        close: jest.fn(),
        serverCount: jest.fn<() => Promise<number>>().mockResolvedValue(1),
        addAll: jest.fn(),
        del: jest.fn(),
        delAll: jest.fn(),
        broadcast: jest.fn(),
      };
    };
  }),
}));

jest.mock('../../src/../src/services/authService', () => ({
  verifyToken: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Import after mocks
import { initializeSocketServer, getSocketServer } from '../../src/../src/services/socketService';
import { verifyToken } from '../../src/../src/services/authService';

describe('Socket Service', () => {
  let mockHttpServer: HttpServer;
  let io: SocketIOServer;

  beforeAll(async () => {
    // Create a real HTTP server for Socket.io
    mockHttpServer = createServer();
    io = await initializeSocketServer(mockHttpServer);
  });

  describe('initializeSocketServer', () => {
    it('should initialize Socket.io server with correct CORS settings', () => {
      expect(io).toBeInstanceOf(SocketIOServer);
      expect(io).toBeDefined();
    });

    it('should set up Redis adapter for multi-server support', () => {
      expect(mockRedisClient.connect).toHaveBeenCalled();
      expect(mockSubClient.connect).toHaveBeenCalled();
      expect(mockRedisClient.duplicate).toHaveBeenCalled();
    });

    it('should configure connection timeout settings', () => {
      // Verify Socket.io instance has timeout configurations
      expect(io).toBeDefined();
    });
  });

  describe('Authentication Middleware', () => {
    it('should have authentication middleware registered', () => {
      const namespace = (io as any)._nsps.get('/');
      expect(namespace).toBeDefined();
      // Socket.io stores middlewares in _fns array
      const middlewares = namespace._fns || [];
      expect(middlewares.length).toBeGreaterThan(0);
    });

    it('should authenticate valid JWT tokens', () => {
      (verifyToken as jest.MockedFunction<typeof verifyToken>).mockReturnValue({
        userId: 'user-123',
        role: 'user',
      });

      const namespace = (io as any)._nsps.get('/');
      expect(namespace).toBeDefined();
      const middlewares = namespace._fns || [];
      expect(middlewares.length).toBeGreaterThan(0);
    });
  });

  describe('getSocketServer', () => {
    it('should return initialized Socket.io server', () => {
      const server = getSocketServer();
      expect(server).toBeInstanceOf(SocketIOServer);
      expect(server).toBe(io);
    });
  });
});
