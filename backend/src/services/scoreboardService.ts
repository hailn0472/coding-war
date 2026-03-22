import prisma from '../utils/prisma';
import { calculateContestScores, ParticipantScore } from './scoringService';
import { createClient } from 'redis';
import { logger } from '../utils/logger';

/**
 * Scoreboard Service
 * Handles scoreboard generation with ranking, caching, and freeze logic
 */

/**
 * Redis client for scoreboard caching
 */
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on('error', (err) => {
  logger.error('Redis scoreboard cache client error', { error: err.message });
});

redisClient.on('connect', () => {
  logger.info('Redis scoreboard cache client connected');
});

// Connect to Redis
redisClient.connect().catch((err) => {
  logger.error('Failed to connect Redis scoreboard cache client', { error: err.message });
});

export interface RankedParticipant extends ParticipantScore {
  rank: number;
}

export interface Scoreboard {
  participants: RankedParticipant[];
  isFrozen: boolean;
  freezeTime?: Date;
}

/**
 * Assign ranks to participants based on their scores
 * Participants with the same score get the same rank
 * 
 * @param participants - Sorted array of participant scores
 * @returns Array of participants with rank assigned
 */
function assignRanks(participants: ParticipantScore[]): RankedParticipant[] {
  const ranked: RankedParticipant[] = [];
  let currentRank = 1;
  
  for (let i = 0; i < participants.length; i++) {
    const participant = participants[i];
    
    // Check if this participant has the same score as the previous one
    if (i > 0) {
      const prev = participants[i - 1];
      
      // For tie detection, compare totalScore and penaltyTime
      const isTie = 
        prev.totalScore === participant.totalScore &&
        prev.penaltyTime === participant.penaltyTime;
      
      if (!isTie) {
        // Not a tie, increment rank
        currentRank = i + 1;
      }
      // If tie, keep the same rank
    }
    
    ranked.push({
      ...participant,
      rank: currentRank,
    });
  }
  
  return ranked;
}

/**
 * Calculate freeze time for a contest
 * Returns null if no freeze time is configured
 * 
 * @param endTime - Contest end time
 * @param freezeMinutes - Minutes before end to freeze (null if no freeze)
 * @returns Freeze time or null
 */
function calculateFreezeTime(endTime: Date, freezeMinutes: number | null): Date | null {
  if (freezeMinutes === null || freezeMinutes === undefined) {
    return null;
  }
  
  const freezeTime = new Date(endTime.getTime() - freezeMinutes * 60 * 1000);
  return freezeTime;
}

/**
 * Check if scoreboard should be frozen for a user
 * 
 * @param contest - Contest object with endTime and freezeTime
 * @param isAdmin - Whether the user is an admin
 * @returns true if scoreboard should be frozen, false otherwise
 */
function shouldFreeze(
  contest: { endTime: Date; freezeTime: number | null },
  isAdmin: boolean
): boolean {
  // Admins always see live scoreboard
  if (isAdmin) {
    return false;
  }
  
  // No freeze time configured
  if (contest.freezeTime === null || contest.freezeTime === undefined) {
    return false;
  }
  
  const now = new Date();
  const freezeTime = calculateFreezeTime(contest.endTime, contest.freezeTime);
  
  if (!freezeTime) {
    return false;
  }
  
  // Check if we're in the freeze period (after freeze time but before end time)
  const isInFreezePeriod = now >= freezeTime && now < contest.endTime;
  
  return isInFreezePeriod;
}

/**
 * Generate scoreboard for a contest
 * 
 * @param contestId - Contest ID
 * @param isAdmin - Whether the requesting user is an admin
 * @returns Scoreboard with ranked participants and freeze status
 */
export async function generateScoreboard(
  contestId: string,
  isAdmin: boolean = false
): Promise<Scoreboard> {
  // Get contest details
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
    throw new Error('Contest not found');
  }
  
  // Check if scoreboard should be frozen
  const isFrozen = shouldFreeze(contest, isAdmin);
  const freezeTime = contest.freezeTime 
    ? calculateFreezeTime(contest.endTime, contest.freezeTime)
    : undefined;
  
  // Check if contest is ongoing (for cache TTL decision)
  const now = new Date();
  const isOngoing = now >= contest.startTime && now < contest.endTime;
  
  // Generate cache key
  const cacheKey = isFrozen 
    ? `scoreboard:${contestId}:frozen`
    : `scoreboard:${contestId}:live`;
  
  // Try to get from cache
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.debug('Scoreboard cache hit', { contestId, isFrozen });
      const scoreboard = JSON.parse(cached) as Scoreboard;
      return scoreboard;
    }
  } catch (error) {
    logger.error('Redis get error for scoreboard', { contestId, error });
  }
  
  logger.debug('Scoreboard cache miss', { contestId, isFrozen });
  
  // Calculate scores for all participants
  const scores = await calculateContestScores(contestId);
  
  // Assign ranks
  const rankedParticipants = assignRanks(scores);
  
  // Build scoreboard
  const scoreboard: Scoreboard = {
    participants: rankedParticipants,
    isFrozen,
    freezeTime: freezeTime || undefined,
  };
  
  // Cache the scoreboard
  // Use 30 seconds TTL during contest, 5 minutes after contest ends
  const ttl = isOngoing ? 30 : 300;
  
  try {
    await redisClient.setEx(cacheKey, ttl, JSON.stringify(scoreboard));
    logger.debug('Scoreboard cached', { contestId, isFrozen, ttl });
  } catch (error) {
    logger.error('Redis set error for scoreboard', { contestId, error });
  }
  
  return scoreboard;
}

/**
 * Invalidate scoreboard cache for a contest
 * 
 * @param contestId - Contest ID
 */
export async function invalidateScoreboardCache(contestId: string): Promise<void> {
  try {
    const keys = await redisClient.keys(`scoreboard:${contestId}:*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.debug('Scoreboard cache invalidated', { contestId, keysDeleted: keys.length });
    }
  } catch (error) {
    logger.error('Redis invalidate error for scoreboard', { contestId, error });
  }
}
