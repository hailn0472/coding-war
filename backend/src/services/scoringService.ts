import prisma from '../utils/prisma';
import { ScoringRule, SubmissionStatus } from '@prisma/client';

/**
 * Scoring Service
 * Handles score calculation for contests based on scoring rules (IOI or ACM)
 */

export interface ProblemScore {
  problemId: string;
  score: number;
  attempts: number;
  solvedAt: Date | null;
  penaltyMinutes: number;
}

export interface ParticipantScore {
  userId: string;
  username: string;
  totalScore: number;
  solvedCount: number;
  penaltyTime: number; // Total penalty in minutes (for ACM)
  problems: ProblemScore[];
}

/**
 * Calculate IOI score for a participant in a contest
 * IOI scoring: Sum points from accepted test cases for each problem
 * 
 * @param contestId - Contest ID
 * @param userId - User ID
 * @returns Participant score with problem breakdown
 */
export async function calculateIOIScore(
  contestId: string,
  userId: string
): Promise<ParticipantScore> {
  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get contest problems with points
  const contestProblems = await prisma.contestProblem.findMany({
    where: { contestId },
    include: {
      problem: {
        include: {
          testCases: true,
        },
      },
    },
    orderBy: { orderIndex: 'asc' },
  });

  const problemScores: ProblemScore[] = [];
  let totalScore = 0;
  let solvedCount = 0;

  for (const contestProblem of contestProblems) {
    const problemId = contestProblem.problemId;
    const maxPoints = contestProblem.points || 0;
    const totalTestCases = contestProblem.problem.testCases.length;

    // Get all submissions for this problem by this user in this contest
    const submissions = await prisma.submission.findMany({
      where: {
        contestId,
        userId,
        problemId,
      },
      include: {
        testCaseResults: true,
      },
      orderBy: { submittedAt: 'asc' },
    });

    let bestScore = 0;
    let attempts = submissions.length;
    let solvedAt: Date | null = null;

    // Find the submission with the highest score
    for (const submission of submissions) {
      if (submission.status === SubmissionStatus.ACCEPTED) {
        // Full score for accepted submission
        bestScore = maxPoints;
        if (!solvedAt) {
          solvedAt = submission.submittedAt;
        }
      } else if (totalTestCases > 0) {
        // Partial score based on passed test cases
        const passedTestCases = submission.testCaseResults.filter(
          (result) => result.status === SubmissionStatus.ACCEPTED
        ).length;
        const partialScore = Math.floor((passedTestCases / totalTestCases) * maxPoints);
        
        if (partialScore > bestScore) {
          bestScore = partialScore;
        }
      }
    }

    if (bestScore > 0) {
      solvedCount++;
    }

    totalScore += bestScore;

    problemScores.push({
      problemId,
      score: bestScore,
      attempts,
      solvedAt,
      penaltyMinutes: 0, // Not used in IOI
    });
  }

  return {
    userId,
    username: user.username,
    totalScore,
    solvedCount,
    penaltyTime: 0, // Not used in IOI
    problems: problemScores,
  };
}

/**
 * Calculate ACM score for a participant in a contest
 * ACM scoring: Count accepted problems + penalty time
 * Penalty = submission time (minutes from start) + (20 * wrong attempts before acceptance)
 * 
 * @param contestId - Contest ID
 * @param userId - User ID
 * @returns Participant score with problem breakdown
 */
export async function calculateACMScore(
  contestId: string,
  userId: string
): Promise<ParticipantScore> {
  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get contest info
  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    select: { startTime: true },
  });

  if (!contest) {
    throw new Error('Contest not found');
  }

  // Get contest problems
  const contestProblems = await prisma.contestProblem.findMany({
    where: { contestId },
    orderBy: { orderIndex: 'asc' },
  });

  const problemScores: ProblemScore[] = [];
  let solvedCount = 0;
  let totalPenaltyTime = 0;

  for (const contestProblem of contestProblems) {
    const problemId = contestProblem.problemId;

    // Get all submissions for this problem by this user in this contest
    const submissions = await prisma.submission.findMany({
      where: {
        contestId,
        userId,
        problemId,
      },
      orderBy: { submittedAt: 'asc' },
    });

    let solved = false;
    let solvedAt: Date | null = null;
    let wrongAttempts = 0;
    let penaltyMinutes = 0;
    const attempts = submissions.length;

    // Process submissions in chronological order
    for (const submission of submissions) {
      if (submission.status === SubmissionStatus.ACCEPTED) {
        solved = true;
        solvedAt = submission.submittedAt;
        
        // Use stored relative time (REQ-11.2)
        // If not available (legacy submissions), calculate it
        const timeFromStart = submission.contestRelativeTime !== null && submission.contestRelativeTime !== undefined
          ? submission.contestRelativeTime
          : Math.floor((submission.submittedAt.getTime() - contest.startTime.getTime()) / (1000 * 60));
        
        // Penalty = time from start + (20 * wrong attempts)
        penaltyMinutes = timeFromStart + (wrongAttempts * 20);
        break; // Stop after first accepted submission
      } else {
        // Count as wrong attempt (any non-accepted status)
        wrongAttempts++;
      }
    }

    if (solved) {
      solvedCount++;
      totalPenaltyTime += penaltyMinutes;
    }

    problemScores.push({
      problemId,
      score: solved ? 1 : 0, // Binary: 1 if solved, 0 otherwise
      attempts,
      solvedAt,
      penaltyMinutes,
    });
  }

  return {
    userId,
    username: user.username,
    totalScore: solvedCount, // In ACM, score is the number of solved problems
    solvedCount,
    penaltyTime: totalPenaltyTime,
    problems: problemScores,
  };
}

/**
 * Calculate score for a participant based on contest scoring rule
 * 
 * @param contestId - Contest ID
 * @param userId - User ID
 * @returns Participant score
 */
export async function calculateScore(
  contestId: string,
  userId: string
): Promise<ParticipantScore> {
  // Get contest scoring rule
  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    select: { scoringRule: true },
  });

  if (!contest) {
    throw new Error('Contest not found');
  }

  if (contest.scoringRule === ScoringRule.IOI) {
    return calculateIOIScore(contestId, userId);
  } else {
    return calculateACMScore(contestId, userId);
  }
}

/**
 * Calculate scores for all participants in a contest
 * 
 * @param contestId - Contest ID
 * @returns Array of participant scores sorted by rank
 */
export async function calculateContestScores(
  contestId: string
): Promise<ParticipantScore[]> {
  // Get all participants
  const participants = await prisma.contestParticipant.findMany({
    where: { contestId },
    select: { userId: true },
  });

  // Calculate score for each participant
  const scores = await Promise.all(
    participants.map((p) => calculateScore(contestId, p.userId))
  );

  // Get contest scoring rule for sorting
  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    select: { scoringRule: true },
  });

  if (!contest) {
    throw new Error('Contest not found');
  }

  // Sort based on scoring rule
  if (contest.scoringRule === ScoringRule.IOI) {
    // IOI: Sort by total score (desc), then by solved count (desc)
    scores.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      return b.solvedCount - a.solvedCount;
    });
  } else {
    // ACM: Sort by solved count (desc), then by penalty time (asc)
    scores.sort((a, b) => {
      if (b.solvedCount !== a.solvedCount) {
        return b.solvedCount - a.solvedCount;
      }
      return a.penaltyTime - b.penaltyTime;
    });
  }

  return scores;
}
