import type { Problem } from '@/types';

export const formatPoints = (points: number, partial: boolean): string => {
  return partial ? `${points}p` : points.toString();
};

export const formatAcceptanceRate = (rate: number): string => {
  return `${rate.toFixed(1)}%`;
};

export const formatUserCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

export const getProblemStatusIcon = (status?: Problem['solvedStatus']) => {
  switch (status) {
    case 'solved':
      return '✓';
    case 'attempted':
      return '○';
    case 'unsolved':
    default:
      return '—';
  }
};

export const getProblemStatusColor = (status?: Problem['solvedStatus']) => {
  switch (status) {
    case 'solved':
      return 'text-green-600 dark:text-green-400';
    case 'attempted':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'unsolved':
    default:
      return 'text-gray-400 dark:text-gray-500';
  }
};

export const getDifficultyColor = (difficulty?: string) => {
  switch (difficulty) {
    case 'Easy':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'Hard':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

export const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    implementation:
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    greedy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    dp: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    graph: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    math: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    string: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    sorting:
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    'binary-search':
      'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  };

  return (
    colors[type] ||
    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  );
};
