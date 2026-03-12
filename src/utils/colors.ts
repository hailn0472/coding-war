export const colors = {
  // Status colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },

  // Problem difficulty colors
  difficulty: {
    trivial: '#4ade80', // green-400
    easy: '#22c55e', // green-500
    medium: '#f59e0b', // amber-500
    hard: '#f97316', // orange-500
    veryHard: '#ef4444', // red-500
    extreme: '#8b5cf6', // violet-500
  },

  // Contest colors
  contest: {
    active: '#22c55e', // green-500
    upcoming: '#3b82f6', // blue-500
    past: '#6b7280', // gray-500
    rated: '#e11d48', // rose-600
    unrated: '#64748b', // slate-500
  },

  // Submission status colors
  submission: {
    accepted: '#22c55e', // green-500
    wrongAnswer: '#ef4444', // red-500
    timeLimitExceeded: '#f59e0b', // amber-500
    memoryLimitExceeded: '#f97316', // orange-500
    runtimeError: '#8b5cf6', // violet-500
    compilationError: '#6b7280', // gray-500
    pending: '#3b82f6', // blue-500
    judging: '#06b6d4', // cyan-500
  },
} as const;

export type StatusColor = keyof typeof colors.submission;
export type DifficultyColor = keyof typeof colors.difficulty;
export type ContestColor = keyof typeof colors.contest;

export const getStatusColor = (status: string): string => {
  const statusMap: Record<string, string> = {
    AC: colors.submission.accepted,
    WA: colors.submission.wrongAnswer,
    TLE: colors.submission.timeLimitExceeded,
    MLE: colors.submission.memoryLimitExceeded,
    RTE: colors.submission.runtimeError,
    CE: colors.submission.compilationError,
    PD: colors.submission.pending,
    JU: colors.submission.judging,
  };

  return statusMap[status] || colors.submission.pending;
};

export const getDifficultyColor = (points: number): string => {
  if (points <= 3) return colors.difficulty.trivial;
  if (points <= 5) return colors.difficulty.easy;
  if (points <= 10) return colors.difficulty.medium;
  if (points <= 20) return colors.difficulty.hard;
  if (points <= 30) return colors.difficulty.veryHard;
  return colors.difficulty.extreme;
};
