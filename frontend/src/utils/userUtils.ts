import type { UserProfile, User } from '@/types';

export const getRatingColor = (rating: number): string => {
  if (rating >= 3000) return 'text-red-600 dark:text-red-400'; // Legendary Grandmaster
  if (rating >= 2600) return 'text-red-500 dark:text-red-400'; // International Grandmaster
  if (rating >= 2400) return 'text-orange-500 dark:text-orange-400'; // Grandmaster
  if (rating >= 2100) return 'text-yellow-500 dark:text-yellow-400'; // International Master
  if (rating >= 1900) return 'text-purple-500 dark:text-purple-400'; // Master
  if (rating >= 1600) return 'text-blue-500 dark:text-blue-400'; // Expert
  if (rating >= 1400) return 'text-cyan-500 dark:text-cyan-400'; // Specialist
  if (rating >= 1200) return 'text-green-500 dark:text-green-400'; // Apprentice
  return 'text-gray-500 dark:text-gray-400'; // Newbie
};

export const getRatingTitle = (rating: number): string => {
  if (rating >= 3000) return 'Legendary Grandmaster';
  if (rating >= 2600) return 'International Grandmaster';
  if (rating >= 2400) return 'Grandmaster';
  if (rating >= 2100) return 'International Master';
  if (rating >= 1900) return 'Master';
  if (rating >= 1600) return 'Expert';
  if (rating >= 1400) return 'Specialist';
  if (rating >= 1200) return 'Apprentice';
  return 'Newbie';
};

export const getRatingBadgeColor = (rating: number): string => {
  if (rating >= 3000)
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  if (rating >= 2600)
    return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
  if (rating >= 2400)
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
  if (rating >= 2100)
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  if (rating >= 1900)
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
  if (rating >= 1600)
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  if (rating >= 1400)
    return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
  if (rating >= 1200)
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
};

export const formatJoinDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatLastLogin = (date?: Date): string => {
  if (!date) return 'Never';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

export const calculateAcceptanceRate = (profile: UserProfile): number => {
  if (profile.submissionCount === 0) return 0;
  return Math.round((profile.problemsSolved / profile.submissionCount) * 100);
};

export const getAvatarUrl = (user: UserProfile | User, size = 150): string => {
  if (user.avatar) {
    return user.avatar;
  }

  // Generate a default avatar using the user's initials
  const initials = user.displayName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${size}&background=random`;
};
