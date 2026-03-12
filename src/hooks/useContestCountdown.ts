import { useState, useEffect } from 'react';
import type { Contest } from '@/types';

export const useContestCountdown = (contest: Contest) => {
  const [timeRemaining, setTimeRemaining] = useState(() => {
    const now = new Date();

    if (contest.timeRemaining) {
      return contest.timeRemaining;
    }

    if (contest.timeBeforeStart) {
      return contest.timeBeforeStart;
    }

    if (contest.timeBeforeEnd) {
      return contest.timeBeforeEnd;
    }

    // Calculate based on current time
    if (contest.startTime > now) {
      return Math.max(0, contest.startTime.getTime() - now.getTime());
    }

    if (contest.endTime && contest.endTime > now) {
      return Math.max(0, contest.endTime.getTime() - now.getTime());
    }

    return 0;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return timeRemaining;
};
