import { Socket } from 'socket.io';
import { getSocketServer } from './socketService';
import { logger } from '../utils/logger';
import prisma from '../utils/prisma';

/**
 * Submission Socket Service
 * Manages submission-specific WebSocket events and rooms
 * Validates: REQ-8.2, REQ-8.3, REQ-8.4
 */

/**
 * Initialize submission socket event handlers
 */
export function initializeSubmissionSocketHandlers(): void {
  const io = getSocketServer();

  io.on('connection', (socket: Socket) => {
    // Handle subscription to submission updates
    socket.on('subscribe:submission', async (data: { submissionId: string }) => {
      try {
        const { submissionId } = data;

        if (!submissionId) {
          socket.emit('error', { message: 'Submission ID is required' });
          return;
        }

        // Verify user has access to this submission
        const hasAccess = await canAccessSubmission(socket.data.userId, socket.data.role, submissionId);

        if (!hasAccess) {
          logger.warn('Unauthorized submission subscription attempt', {
            socketId: socket.id,
            userId: socket.data.userId,
            submissionId,
          });
          socket.emit('error', { message: 'Unauthorized access to submission' });
          return;
        }

        // Join submission room
        const roomName = `submission:${submissionId}`;
        socket.join(roomName);

        logger.info('Socket subscribed to submission', {
          socketId: socket.id,
          userId: socket.data.userId,
          submissionId,
          roomName,
        });

        socket.emit('subscribed:submission', { submissionId });
      } catch (error) {
        logger.error('Error subscribing to submission', {
          socketId: socket.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        socket.emit('error', { message: 'Failed to subscribe to submission' });
      }
    });

    // Handle unsubscription from submission updates
    socket.on('unsubscribe:submission', (data: { submissionId: string }) => {
      try {
        const { submissionId } = data;

        if (!submissionId) {
          return;
        }

        const roomName = `submission:${submissionId}`;
        socket.leave(roomName);

        logger.info('Socket unsubscribed from submission', {
          socketId: socket.id,
          userId: socket.data.userId,
          submissionId,
          roomName,
        });

        socket.emit('unsubscribed:submission', { submissionId });
      } catch (error) {
        logger.error('Error unsubscribing from submission', {
          socketId: socket.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  });

  logger.info('Submission socket handlers initialized');
}

/**
 * Check if user can access a submission
 * Users can access their own submissions, admins can access all
 */
async function canAccessSubmission(userId: string, role: string, submissionId: string): Promise<boolean> {
  try {
    // Admins can access all submissions
    if (role === 'admin') {
      return true;
    }

    // Check if submission belongs to user
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { userId: true },
    });

    if (!submission) {
      return false;
    }

    return submission.userId === userId;
  } catch (error) {
    logger.error('Error checking submission access', {
      userId,
      submissionId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Emit submission status update to room
 */
export function emitSubmissionUpdate(
  submissionId: string,
  status: string,
  progress?: { current: number; total: number }
): void {
  try {
    const io = getSocketServer();
    const roomName = `submission:${submissionId}`;

    const payload: {
      submissionId: string;
      status: string;
      progress?: { current: number; total: number };
      timestamp: string;
    } = {
      submissionId,
      status,
      timestamp: new Date().toISOString(),
    };

    if (progress) {
      payload.progress = progress;
    }

    io.to(roomName).emit('submission:update', payload);

    logger.debug('Emitted submission update', {
      submissionId,
      status,
      progress,
      roomName,
    });
  } catch (error) {
    logger.error('Error emitting submission update', {
      submissionId,
      status,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Emit submission completion event to room
 */
export function emitSubmissionComplete(
  submissionId: string,
  verdict: string,
  executionTime: number,
  memoryUsed: number,
  testCaseResults: Array<{
    testCaseId: string;
    status: string;
    executionTime: number;
    memoryUsed: number;
  }>
): void {
  try {
    const io = getSocketServer();
    const roomName = `submission:${submissionId}`;

    io.to(roomName).emit('submission:complete', {
      submissionId,
      verdict,
      executionTime,
      memoryUsed,
      testCaseResults,
      timestamp: new Date().toISOString(),
    });

    logger.info('Emitted submission complete', {
      submissionId,
      verdict,
      executionTime,
      memoryUsed,
      roomName,
    });
  } catch (error) {
    logger.error('Error emitting submission complete', {
      submissionId,
      verdict,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
