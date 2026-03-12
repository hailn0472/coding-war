import React from 'react';
import { useContestCountdown } from '@/hooks/useContestCountdown';
import { getContestStatusText } from '@/utils/contestUtils';
import type { Contest } from '@/types';
import { Clock } from 'lucide-react';
import { cn } from '@/utils';

interface CountdownTimerProps {
  contest: Contest;
  className?: string;
  showIcon?: boolean;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  contest,
  className,
  showIcon = true,
}) => {
  const timeRemaining = useContestCountdown(contest);
  const statusText = getContestStatusText(contest, timeRemaining);

  const getStatusColor = () => {
    if (contest.participationStatus === 'active') {
      return 'text-green-600 dark:text-green-400';
    }

    if (timeRemaining > 0) {
      if (timeRemaining < 60 * 60 * 1000) {
        // Less than 1 hour
        return 'text-red-600 dark:text-red-400';
      } else if (timeRemaining < 24 * 60 * 60 * 1000) {
        // Less than 1 day
        return 'text-yellow-600 dark:text-yellow-400';
      }
      return 'text-blue-600 dark:text-blue-400';
    }

    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {showIcon && <Clock className="text-muted-foreground h-4 w-4" />}
      <span className={cn('text-sm font-medium', getStatusColor())}>
        {statusText}
      </span>
    </div>
  );
};

export default CountdownTimer;
