import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { hashPassword, verifyPassword } from './authService';

/**
 * User Service
 * Handles user profile and statistics operations
 */

interface UpdateUserData {
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Get user profile with statistics
 * Requirements: REQ-5.5
 */
export async function getUserProfile(
  userId: string,
  requestingUserId: string,
  requestingUserRole: string
) {
  // Get user from database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      isEmailVerified: true,
    },
  });

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  // Determine if email should be visible
  // Email is visible if: requesting own profile OR requesting user is admin
  const isOwnProfile = requestingUserId === userId;
  const isAdmin = requestingUserRole === 'ADMIN';
  const showEmail = isOwnProfile || isAdmin;

  // Calculate user statistics
  const [totalSubmissions, acceptedSubmissions, solvedProblems, contestsParticipated] =
    await Promise.all([
      // Total submissions
      prisma.submission.count({
        where: { userId },
      }),

      // Accepted submissions
      prisma.submission.count({
        where: {
          userId,
          status: 'ACCEPTED',
        },
      }),

      // Unique problems solved (distinct problemId where status is ACCEPTED)
      prisma.submission
        .findMany({
          where: {
            userId,
            status: 'ACCEPTED',
          },
          select: {
            problemId: true,
          },
          distinct: ['problemId'],
        })
        .then((results) => results.length),

      // Contests participated (distinct contestId from submissions)
      prisma.submission
        .findMany({
          where: {
            userId,
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
    ...(showEmail && { email: user.email }),
    role: user.role,
    createdAt: user.createdAt,
    statistics: {
      totalSubmissions,
      acceptedSubmissions,
      solvedProblems,
      contestsParticipated,
    },
  };
}

/**
 * Update user profile
 * Requirements: REQ-5.5
 */
export async function updateUserProfile(
  userId: string,
  data: UpdateUserData,
  _requestingUserId: string
) {
  // Get user from database
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  // Prepare update data
  const updateData: any = {};

  // Update email if provided
  if (data.email) {
    // Check if email is already taken by another user
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail && existingEmail.id !== userId) {
      throw new AppError(409, 'EMAIL_EXISTS', 'Email already exists');
    }

    updateData.email = data.email;
    // Reset email verification when email changes
    updateData.isEmailVerified = false;
  }

  // Update password if provided
  if (data.newPassword) {
    // Verify current password
    if (!data.currentPassword) {
      throw new AppError(400, 'CURRENT_PASSWORD_REQUIRED', 'Current password is required');
    }

    const isPasswordValid = await verifyPassword(data.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError(401, 'INVALID_PASSWORD', 'Current password is incorrect');
    }

    // Hash new password
    updateData.passwordHash = await hashPassword(data.newPassword);
  }

  // Update user in database
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
}

/**
 * Get user's submission history
 * Requirements: REQ-9.1, REQ-9.2
 */
export async function getUserSubmissions(
  userId: string,
  pagination: PaginationParams,
  _requestingUserId: string,
  _requestingUserRole: string
) {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  // Get submissions with pagination
  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where: { userId },
      select: {
        id: true,
        problemId: true,
        problem: {
          select: {
            title: true,
          },
        },
        language: true,
        status: true,
        verdict: true,
        executionTime: true,
        memoryUsed: true,
        submittedAt: true,
      },
      orderBy: {
        submittedAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.submission.count({
      where: { userId },
    }),
  ]);

  // Format submissions
  const formattedSubmissions = submissions.map((submission) => ({
    id: submission.id,
    problemId: submission.problemId,
    problemTitle: submission.problem.title,
    language: submission.language,
    status: submission.status,
    verdict: submission.verdict,
    executionTime: submission.executionTime,
    memoryUsed: submission.memoryUsed,
    submittedAt: submission.submittedAt,
  }));

  return {
    submissions: formattedSubmissions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
