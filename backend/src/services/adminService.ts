import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { Role } from '@prisma/client';

/**
 * Admin Service
 * Handles admin panel operations
 * Requirements: REQ-13.3, REQ-13.5
 */

interface GetAllUsersParams {
  page: number;
  limit: number;
  search?: string;
  role?: string;
}

/**
 * Get paginated list of all users with statistics
 * Requirements: REQ-13.3
 */
export async function getAllUsers(params: GetAllUsersParams) {
  const { page, limit, search, role } = params;

  // Build where clause
  const where: any = {};

  // Search by username or email
  if (search) {
    where.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Filter by role
  if (role) {
    where.role = role;
  }

  const skip = (page - 1) * limit;

  // Get users with pagination
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  // Get statistics for each user
  const usersWithStats = await Promise.all(
    users.map(async (user) => {
      const [totalSubmissions, acceptedSubmissions, solvedProblems, contestsParticipated] =
        await Promise.all([
          // Total submissions
          prisma.submission.count({
            where: { userId: user.id },
          }),

          // Accepted submissions
          prisma.submission.count({
            where: {
              userId: user.id,
              status: 'ACCEPTED',
            },
          }),

          // Unique problems solved
          prisma.submission
            .findMany({
              where: {
                userId: user.id,
                status: 'ACCEPTED',
              },
              select: {
                problemId: true,
              },
              distinct: ['problemId'],
            })
            .then((results) => results.length),

          // Contests participated
          prisma.submission
            .findMany({
              where: {
                userId: user.id,
                contestId: { not: null },
              },
              select: {
                contestId: true,
              },
              distinct: ['contestId'],
            })
            .then((results) => results.length),
        ]);

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        statistics: {
          totalSubmissions,
          acceptedSubmissions,
          solvedProblems,
          contestsParticipated,
        },
      };
    })
  );

  return {
    users: usersWithStats,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Update user role
 * Requirements: REQ-13.3
 */
export async function updateUserRole(userId: string, role: string) {
  // Validate role
  if (!['ADMIN', 'USER', 'GUEST'].includes(role)) {
    throw new AppError(400, 'INVALID_ROLE', 'Invalid role value');
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  // Update user role
  await prisma.user.update({
    where: { id: userId },
    data: { role: role as Role },
  });
}

/**
 * Get system-wide statistics
 * Requirements: REQ-13.5
 */
export async function getSystemStatistics() {
  // Get total counts
  const [totalUsers, totalProblems, totalSubmissions, totalContests] = await Promise.all([
    prisma.user.count(),
    prisma.problem.count(),
    prisma.submission.count(),
    prisma.contest.count(),
  ]);

  // Get recent activity data (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get submissions per day for last 30 days
  const submissionsPerDay = await prisma.$queryRaw<
    Array<{ date: Date; count: bigint }>
  >`
    SELECT DATE("submittedAt") as date, COUNT(*)::bigint as count
    FROM "Submission"
    WHERE "submittedAt" >= ${thirtyDaysAgo}
    GROUP BY DATE("submittedAt")
    ORDER BY date ASC
  `;

  // Get new users per day for last 30 days
  const newUsersPerDay = await prisma.$queryRaw<
    Array<{ date: Date; count: bigint }>
  >`
    SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
    FROM "User"
    WHERE "createdAt" >= ${thirtyDaysAgo}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;

  // Create a map of all dates in the last 30 days
  const recentActivity: Array<{ date: string; submissions: number; newUsers: number }> = [];
  const submissionsMap = new Map(
    submissionsPerDay.map((row) => [
      row.date.toISOString().split('T')[0],
      Number(row.count),
    ])
  );
  const usersMap = new Map(
    newUsersPerDay.map((row) => [
      row.date.toISOString().split('T')[0],
      Number(row.count),
    ])
  );

  // Fill in all 30 days (including days with 0 activity)
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    recentActivity.push({
      date: dateStr,
      submissions: submissionsMap.get(dateStr) || 0,
      newUsers: usersMap.get(dateStr) || 0,
    });
  }

  return {
    totalUsers,
    totalProblems,
    totalSubmissions,
    totalContests,
    recentActivity,
  };
}
