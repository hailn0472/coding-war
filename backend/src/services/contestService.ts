import prisma from '../utils/prisma';
import { ScoringRule, Visibility } from '@prisma/client';

/**
 * Contest Service
 * Handles CRUD operations for contests
 */

interface CreateContestInput {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  freezeTime?: number;
  scoringRule: ScoringRule;
  visibility: Visibility;
}

interface UpdateContestInput {
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  freezeTime?: number;
  scoringRule?: ScoringRule;
  visibility?: Visibility;
}

interface ListContestsFilter {
  status?: 'upcoming' | 'ongoing' | 'ended';
  page?: number;
  limit?: number;
}

/**
 * Generate a URL-friendly slug from a title
 * @param title - Contest title
 * @returns URL-friendly slug
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single hyphen
    .substring(0, 255);        // Limit to 255 characters
}

/**
 * Ensure slug is unique by appending a number if necessary
 * @param baseSlug - Base slug to make unique
 * @returns Unique slug
 */
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.contest.findUnique({
      where: { slug },
    });
    
    if (!existing) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Create a new contest with all fields
 * @param data - Contest data
 * @returns Created contest
 */
export async function createContest(data: CreateContestInput) {
  const baseSlug = generateSlug(data.title);
  const slug = await ensureUniqueSlug(baseSlug);
  
  return prisma.contest.create({
    data: {
      title: data.title,
      slug,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
      freezeTime: data.freezeTime,
      scoringRule: data.scoringRule,
      visibility: data.visibility,
    },
  });
}

/**
 * Update an existing contest with partial updates
 * @param id - Contest ID
 * @param data - Partial contest data to update
 * @returns Updated contest
 */
export async function updateContest(id: string, data: UpdateContestInput) {
  const updateData: any = { ...data };
  
  // If title is being updated, regenerate slug
  if (data.title) {
    const baseSlug = generateSlug(data.title);
    const slug = await ensureUniqueSlug(baseSlug);
    updateData.slug = slug;
  }
  
  return prisma.contest.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Delete a contest with cascade deletion
 * @param id - Contest ID
 * @returns Deleted contest
 */
export async function deleteContest(id: string) {
  // Prisma will handle cascade deletion based on schema
  // This will delete ContestProblem and ContestParticipant records
  return prisma.contest.delete({
    where: { id },
  });
}

/**
 * Get a contest by ID with problems and participant count
 * @param id - Contest ID
 * @returns Contest with problems and participant count
 */
export async function getContestById(id: string) {
  const contest = await prisma.contest.findUnique({
    where: { id },
    include: {
      problems: {
        include: {
          problem: {
            select: {
              id: true,
              title: true,
              difficulty: true,
            },
          },
        },
        orderBy: {
          orderIndex: 'asc',
        },
      },
      _count: {
        select: {
          participants: true,
        },
      },
    },
  });
  
  if (!contest) {
    return null;
  }
  
  // Transform the response to include participant count
  return {
    ...contest,
    participantCount: contest._count.participants,
    _count: undefined, // Remove _count from response
  };
}

/**
 * List contests with status filtering and pagination
 * @param filter - Filter options
 * @returns Paginated list of contests
 */
export async function listContests(filter: ListContestsFilter = {}) {
  const {
    status,
    page = 1,
    limit = 20,
  } = filter;
  
  // Build where clause based on status
  const where: any = {};
  const now = new Date();
  
  if (status === 'upcoming') {
    where.startTime = {
      gt: now,
    };
  } else if (status === 'ongoing') {
    where.AND = [
      { startTime: { lte: now } },
      { endTime: { gte: now } },
    ];
  } else if (status === 'ended') {
    where.endTime = {
      lt: now,
    };
  }
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Execute query with pagination
  const [contests, total] = await Promise.all([
    prisma.contest.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        startTime: 'desc',
      },
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
      },
    }),
    prisma.contest.count({ where }),
  ]);
  
  // Transform contests to include participant count
  const transformedContests = contests.map(contest => ({
    ...contest,
    participantCount: contest._count.participants,
    _count: undefined,
  }));
  
  return {
    contests: transformedContests,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Register a user for a contest
 * @param contestId - Contest ID
 * @param userId - User ID
 * @throws Error if contest not found, already started, or user not allowed
 */
export async function registerForContest(contestId: string, userId: string) {
  // Get contest details
  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    select: {
      id: true,
      visibility: true,
      startTime: true,
    },
  });
  
  if (!contest) {
    throw new Error('Contest not found');
  }
  
  // Check if contest has already started
  const now = new Date();
  if (contest.startTime <= now) {
    throw new Error('Cannot register after contest has started');
  }
  
  // For private contests, verify user is allowed
  // Note: In a full implementation, there would be an allowedParticipants list
  // For now, we'll just check visibility
  if (contest.visibility === 'PRIVATE') {
    // In a real implementation, check if user is in allowed participant list
    // For MVP, we'll throw an error for private contests
    throw new Error('This is a private contest. Registration requires invitation.');
  }
  
  // Check if user is already registered
  const existingParticipant = await prisma.contestParticipant.findUnique({
    where: {
      contestId_userId: {
        contestId,
        userId,
      },
    },
  });
  
  if (existingParticipant) {
    throw new Error('User is already registered for this contest');
  }
  
  // Register user for contest
  return prisma.contestParticipant.create({
    data: {
      contestId,
      userId,
    },
  });
}

/**
 * Check if a user can view contest problems
 * User must be registered AND contest must have started
 * @param contestId - Contest ID
 * @param userId - User ID
 * @returns true if user can view problems, false otherwise
 */
export async function canViewContestProblems(contestId: string, userId: string): Promise<boolean> {
  // Get contest details
  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    select: {
      id: true,
      startTime: true,
    },
  });
  
  if (!contest) {
    return false;
  }
  
  // Check if contest has started
  const now = new Date();
  if (contest.startTime > now) {
    return false;
  }
  
  // Check if user is registered
  const participant = await prisma.contestParticipant.findUnique({
    where: {
      contestId_userId: {
        contestId,
        userId,
      },
    },
  });
  
  return participant !== null;
}

/**
 * Check if a user can submit to a contest
 * User must be registered AND contest must be ongoing (started but not ended)
 * @param contestId - Contest ID
 * @param userId - User ID
 * @returns true if user can submit, false otherwise
 */
export async function canSubmitToContest(contestId: string, userId: string): Promise<boolean> {
  // Get contest details
  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    select: {
      id: true,
      startTime: true,
      endTime: true,
    },
  });
  
  if (!contest) {
    return false;
  }
  
  // Check if contest is ongoing (started but not ended)
  const now = new Date();
  if (contest.startTime > now) {
    // Contest hasn't started yet
    return false;
  }
  
  if (contest.endTime < now) {
    // Contest has ended
    return false;
  }
  
  // Check if user is registered
  const participant = await prisma.contestParticipant.findUnique({
    where: {
      contestId_userId: {
        contestId,
        userId,
      },
    },
  });
  
  return participant !== null;
}
