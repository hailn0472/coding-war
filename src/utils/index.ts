// Utility functions for Coding War

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration in human readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
}

/**
 * Format memory usage in human readable format
 */
export function formatMemory(kb: number): string {
  if (kb < 1024) {
    return `${kb} KB`;
  } else if (kb < 1024 * 1024) {
    return `${(kb / 1024).toFixed(1)} MB`;
  } else {
    return `${(kb / (1024 * 1024)).toFixed(1)} GB`;
  }
}

/**
 * Format points with optional partial indicator
 */
export function formatPoints(points: number, partial: boolean = false): string {
  const formatted = points % 1 === 0 ? points.toString() : points.toFixed(1);
  return partial ? `${formatted}p` : formatted;
}

/**
 * Get rating color class based on rating value
 */
export function getRatingColor(rating: number): string {
  if (rating >= 3000) return 'rating-legendary';
  if (rating >= 2600) return 'rating-grandmaster';
  if (rating >= 2400) return 'rating-international';
  if (rating >= 2100) return 'rating-master';
  if (rating >= 1900) return 'rating-expert';
  if (rating >= 1600) return 'rating-specialist';
  if (rating >= 1400) return 'rating-apprentice';
  return 'rating-newbie';
}

/**
 * Get rating title based on rating value
 */
export function getRatingTitle(rating: number): string {
  if (rating >= 3000) return 'Legendary Grandmaster';
  if (rating >= 2600) return 'International Grandmaster';
  if (rating >= 2400) return 'Grandmaster';
  if (rating >= 2100) return 'International Master';
  if (rating >= 1900) return 'Master';
  if (rating >= 1600) return 'Expert';
  if (rating >= 1400) return 'Specialist';
  if (rating >= 1200) return 'Apprentice';
  return 'Newbie';
}

/**
 * Get problem status color class
 */
export function getProblemStatusColor(
  status: 'solved' | 'attempted' | 'unsolved'
): string {
  switch (status) {
    case 'solved':
      return 'status-solved';
    case 'attempted':
      return 'status-attempted';
    case 'unsolved':
    default:
      return 'status-unsolved';
  }
}

/**
 * Get submission result color and text
 */
export function getSubmissionResultInfo(result: string): {
  color: string;
  text: string;
} {
  switch (result) {
    case 'AC':
      return { color: 'text-green-600', text: 'Accepted' };
    case 'WA':
      return { color: 'text-red-600', text: 'Wrong Answer' };
    case 'TLE':
      return { color: 'text-orange-600', text: 'Time Limit Exceeded' };
    case 'MLE':
      return { color: 'text-purple-600', text: 'Memory Limit Exceeded' };
    case 'RE':
      return { color: 'text-red-500', text: 'Runtime Error' };
    case 'CE':
      return { color: 'text-yellow-600', text: 'Compilation Error' };
    case 'IE':
      return { color: 'text-gray-600', text: 'Internal Error' };
    case 'QU':
      return { color: 'text-blue-600', text: 'Queued' };
    case 'G':
      return { color: 'text-blue-500', text: 'Grading' };
    default:
      return { color: 'text-gray-500', text: 'Unknown' };
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Generate random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Sleep function for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
// Re-export navigation utilities
export * from './navigation';
// Re-export color utilities
export * from './colors';
