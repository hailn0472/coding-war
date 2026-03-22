import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { verifyToken } from './authService';
import { logger } from '../utils/logger';

/**
 * Socket.io Service
 * Manages WebSocket connections for real-time submission status updates
 * Validates: REQ-8.1, REQ-8.5
 */

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.io server with Redis adapter
 */
export async function initializeSocketServer(httpServer: HttpServer): Promise<SocketIOServer> {
  // Create Socket.io server
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
    connectTimeout: 45000, // 45 seconds
  });

  // Set up Redis adapter for multi-server support
  const pubClient = createClient({
    url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
    password: process.env.REDIS_PASSWORD || undefined,
  });

  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);

  io.adapter(createAdapter(pubClient, subClient));

  logger.info('Socket.io server initialized with Redis adapter');

  // Authentication middleware
  io.use(async (socket: Socket, next) => {
    try {
      // Extract JWT token from handshake auth or query
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token || typeof token !== 'string') {
        logger.warn('Socket connection rejected: No token provided', {
          socketId: socket.id,
        });
        return next(new Error('Authentication required'));
      }

      // Verify JWT token
      const decoded = verifyToken(token);

      if (!decoded) {
        logger.warn('Socket connection rejected: Invalid token', {
          socketId: socket.id,
        });
        return next(new Error('Invalid token'));
      }

      // Attach user info to socket
      socket.data.userId = decoded.userId;
      socket.data.role = decoded.role;

      logger.debug('Socket authenticated', {
        socketId: socket.id,
        userId: decoded.userId,
        role: decoded.role,
      });

      next();
    } catch (error) {
      logger.error('Socket authentication error', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(new Error('Authentication failed'));
    }
  });

  // Connection timeout (5 minutes of inactivity)
  io.on('connection', (socket: Socket) => {
    logger.info('Socket connected', {
      socketId: socket.id,
      userId: socket.data.userId,
    });

    // Set up inactivity timeout
    let inactivityTimeout: NodeJS.Timeout;

    const resetInactivityTimeout = () => {
      if (inactivityTimeout) {
        clearTimeout(inactivityTimeout);
      }
      inactivityTimeout = setTimeout(() => {
        logger.info('Socket disconnected due to inactivity', {
          socketId: socket.id,
          userId: socket.data.userId,
        });
        socket.disconnect(true);
      }, 5 * 60 * 1000); // 5 minutes
    };

    resetInactivityTimeout();

    // Reset timeout on any activity
    socket.onAny(() => {
      resetInactivityTimeout();
    });

    socket.on('disconnect', (reason) => {
      if (inactivityTimeout) {
        clearTimeout(inactivityTimeout);
      }
      logger.info('Socket disconnected', {
        socketId: socket.id,
        userId: socket.data.userId,
        reason,
      });
    });

    socket.on('error', (error) => {
      logger.error('Socket error', {
        socketId: socket.id,
        userId: socket.data.userId,
        error: error.message,
      });
    });
  });

  return io;
}

/**
 * Get Socket.io server instance
 */
export function getSocketServer(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io server not initialized');
  }
  return io;
}

/**
 * Close Socket.io server
 */
export async function closeSocketServer(): Promise<void> {
  if (io) {
    logger.info('Closing Socket.io server...');
    io.close();
    io = null;
    logger.info('Socket.io server closed');
  }
}
