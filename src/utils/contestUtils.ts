import type { Contest, ContestStatus } from '@/types';

export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

export const formatTime = (date: Date): string => {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const formatTimeRange = (startTime: Date, endTime?: Date): string => {
  const start = formatTime(startTime);
  if (!endTime) {
    return `Starts: ${start}`;
  }
  const end = formatTime(endTime);
  return `${start} - ${end}`;
};

export const getContestStatus = (contest: Contest): ContestStatus => {
  const now = new Date();

  if (contest.participationStatus === 'active') {
    return 'active';
  }

  if (contest.startTime > now) {
    return 'upcoming';
  }

  if (contest.endTime && contest.endTime <= now) {
    return 'past';
  }

  return 'ongoing';
};

export const getContestStatusText = (
  contest: Contest,
  timeRemaining?: number
): string => {
  const status = getContestStatus(contest);

  if (status === 'active') {
    if (timeRemaining && timeRemaining > 0) {
      return `Window ends in ${formatDuration(timeRemaining)}`;
    }
    return 'Participating';
  }

  if (status === 'ongoing') {
    if (timeRemaining && timeRemaining > 0) {
      return `Ends in ${formatDuration(timeRemaining)}`;
    }
    return 'Ongoing';
  }

  if (status === 'upcoming') {
    if (timeRemaining && timeRemaining > 0) {
      return `Starts in ${formatDuration(timeRemaining)}`;
    }
    return 'Upcoming';
  }

  return 'Ended';
};

export const getDurationText = (contest: Contest): string => {
  if (!contest.timeLimit) {
    if (contest.endTime) {
      const duration = contest.endTime.getTime() - contest.startTime.getTime();
      return `${Math.floor(duration / (1000 * 60 * 60))} hours long`;
    }
    return 'Duration not specified';
  }

  const hours = Math.floor(contest.timeLimit / (1000 * 60 * 60));
  const minutes = Math.floor(
    (contest.timeLimit % (1000 * 60 * 60)) / (1000 * 60)
  );

  if (contest.endTime) {
    const totalDuration =
      contest.endTime.getTime() - contest.startTime.getTime();
    if (contest.timeLimit < totalDuration) {
      return `${hours}${minutes > 0 ? `.${Math.floor(minutes / 6)}` : ''} hour window`;
    }
  }

  return `${hours}${minutes > 0 ? `.${Math.floor(minutes / 6)}` : ''} hours long`;
};

export const formatUserCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

export const getContestActions = (contest: Contest, isAuthenticated = true) => {
  if (!isAuthenticated) {
    return { canJoin: false, canSpectate: false, showLogin: true };
  }

  if (contest.participationStatus === 'active') {
    return {
      canJoin: false,
      canSpectate: false,
      currentAction: 'participating',
      showContinue: true,
    };
  }

  const status = getContestStatus(contest);

  if (status === 'past') {
    return {
      canJoin: false,
      canSpectate: contest.canSpectate,
      showVirtualJoin: true,
    };
  }

  return {
    canJoin: contest.canJoin,
    canSpectate: contest.canSpectate,
  };
};
