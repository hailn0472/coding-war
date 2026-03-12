import React, { useState, useEffect } from 'react';
import { useWebSocket } from '@/providers/WebSocketProvider';
import type { ActivityItem } from '@/types';
import { Activity, Trophy, Code, Award, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils';

interface ActivityFeedProps {
  className?: string;
  maxItems?: number;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  className,
  maxItems = 50,
}) => {
  const { subscribe, unsubscribe } = useWebSocket();
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const handleActivity = (activity: ActivityItem) => {
      setActivities(prev => [activity, ...prev.slice(0, maxItems - 1)]);
    };

    subscribe('user_activity', handleActivity);
    return () => unsubscribe('user_activity', handleActivity);
  }, [subscribe, unsubscribe, maxItems]);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'submission':
        return <Code className="h-4 w-4" />;
      case 'contest_join':
        return <Trophy className="h-4 w-4" />;
      case 'problem_solve':
        return <Award className="h-4 w-4 text-green-500" />;
      case 'achievement':
        return <Award className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityMessage = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'submission':
        return (
          <>
            submitted a solution to{' '}
            <Link
              to={`/problem/${activity.data.problemCode}`}
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              {activity.data.problemName}
            </Link>
            {activity.data.result && (
              <span
                className={cn(
                  'ml-2 rounded px-2 py-1 text-xs font-medium',
                  activity.data.result === 'AC'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                )}
              >
                {activity.data.result}
              </span>
            )}
          </>
        );
      case 'contest_join':
        return (
          <>
            joined contest{' '}
            <Link
              to={`/contest/${activity.data.contestKey}`}
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              {activity.data.contestName}
            </Link>
          </>
        );
      case 'problem_solve':
        return (
          <>
            solved{' '}
            <Link
              to={`/problem/${activity.data.problemCode}`}
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              {activity.data.problemName}
            </Link>
          </>
        );
      case 'achievement':
        return (
          <>
            earned achievement{' '}
            <span className="font-medium text-yellow-600">
              {activity.data.achievement}
            </span>
          </>
        );
      default:
        return 'performed an activity';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="mb-4 flex items-center space-x-2">
        <Activity className="text-muted-foreground h-5 w-5" />
        <h3 className="text-foreground font-medium">Recent Activity</h3>
      </div>

      {activities.length === 0 ? (
        <div className="text-muted-foreground py-8 text-center">
          <Activity className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map(activity => (
            <div
              key={activity.id}
              className="bg-card hover:bg-muted/30 flex items-start space-x-3 rounded-lg border p-3 transition-colors"
            >
              <div className="flex-shrink-0">
                <img
                  src={
                    activity.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.username)}&size=32&background=random`
                  }
                  alt={`${activity.username}'s avatar`}
                  className="border-border h-8 w-8 rounded-full border"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  {getActivityIcon(activity.type)}
                  <Link
                    to={`/users/${activity.username}`}
                    className="text-foreground font-medium hover:text-primary-600"
                  >
                    {activity.username}
                  </Link>
                </div>

                <p className="text-muted-foreground mt-1 text-sm">
                  {getActivityMessage(activity)}
                </p>

                <div className="text-muted-foreground mt-2 flex items-center space-x-1 text-xs">
                  <Clock className="h-3 w-3" />
                  <span>{formatTimeAgo(activity.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
