import { Socket } from 'socket.io';
import { getSocketServer } from './socketService';
import { logger } from '../utils/logger';
import prisma from '../utils/prisma';
import { generateScoreboard } from './scoreboardService';

/**
 * Scoreboard Socket Service
 * Manages scoreboard-specific WebSocket events and rooms
 * Validates: REQ-11.6, REQ-12.3
 */

/**
 * Initialize scoreboard socket event handlers
 */
export function initializeScoreboardSocketHandlers(): void {
  const io = getSocketServer();

  io.on('connection', (socket: Socket) => {
    // Handle subscription to scoreboard updates
    socket.on('subscribe:scoreboard', async (data: { contestId: string }) => {
      try {
        const { contestId } = data;

        if (!contestId) {
          socket.emit('error', { message: 'Contest ID is required' });
          return;
        }

        // Verify contest exists
        const contest = await prisma.contest.findUnique({
          where: { id: contestId },
          select: { id: true },
        });

        if (!contest) {
          socket.emit('error', { message: 'Contest not found' });
          return;
        }

        // Join scoreboard room
        const roomName = `scoreboard:${contestId}`;
        socket.join(roomName);

        logger.info('Socket subscribed to scoreboard', {
          socketId: socket.id,
          userId: socket.data.userId,
          contestId,
          roomName,
        });

        socket.emit('subscribed:scoreboard', { contestId });
      } catch (error) {
        logger.error('Error subscribing to scoreboard', {
          socketId: socket.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        socket.emit('error', { message: 'Failed to subscribe to scoreboard' });
      }
    });

    // Handle unsubscription from scoreboard updates
    socket.on('unsubscribe:scoreboard', (data: { contestId: string }) => {
      try {
        const { contestId } = data;

        if (!contestId) {
          return;
        }

        const roomName = `scoreboard:${contestId}`;
        socket.leave(roomName);

        logger.info('Socket unsubscribed from scoreboard', {
          socketId: socket.id,
          userId: socket.data.userId,
          contestId,
          roomName,
        });

        socket.emit('unsubscribed:scoreboard', { contestId });
      } catch (error) {
        logger.error('Error unsubscribing from scoreboard', {
          socketId: socket.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  });

  logger.info('Scoreboard socket handlers initialized');
}

/**
 * Emit scoreboard update to appropriate users
 * Respects freeze time: admins always see live, contestants see frozen during freeze period
 */
export async function emitScoreboardUpdate(contestId: string): Promise<void> {
  try {
    const io = getSocketServer();
    const roomName = `scoreboard:${contestId}`;

    // Get contest details to check freeze time
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      select: {
        id: true,
        endTime: true,
        freezeTime: true,
        startTime: true,
      },
    });

    if (!contest) {
      logger.warn('Contest not found for scoreboard update', { contestId });
      return;
    }

    // Check if we're in freeze period
    const now = new Date();
    const isInFreezePeriod = contest.freezeTime
      ? now >= new Date(contest.endTime.getTime() - contest.freezeTime * 60 * 1000) && now < contest.endTime
      : false;

    // Get all sockets in the room
    const socketsInRoom = await io.in(roomName).fetchSockets();

    logger.debug('Emitting scoreboard update', {
      contestId,
      roomName,
      socketsCount: socketsInRoom.length,
      isInFreezePeriod,
    });

    // Emit to each socket based on their role
    for (const socket of socketsInRoom) {
      const isAdmin = socket.data.role === 'admin';

      // Admins always see live scoreboard
      // Contestants see frozen scoreboard during freeze period
      const shouldSeeLive = isAdmin || !isInFreezePeriod;

      // Generate scoreboard based on user role
      const scoreboard = await generateScoreboard(contestId, isAdmin);

      socket.emit('scoreboard:update', {
        contestId,
        scoreboard,
        timestamp: new Date().toISOString(),
      });

      logger.debug('Emitted scoreboard to socket', {
        socketId: socket.id,
        userId: socket.data.userId,
        isAdmin,
        shouldSeeLive,
        isFrozen: scoreboard.isFrozen,
      });
    }

    logger.info('Scoreboard update emitted', {
      contestId,
      socketsNotified: socketsInRoom.length,
      isInFreezePeriod,
    });
  } catch (error) {
    logger.error('Error emitting scoreboard update', {
      contestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
