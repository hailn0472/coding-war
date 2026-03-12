import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Contest } from '@/types';
import ContestTags from './ContestTags';
import CountdownTimer from './CountdownTimer';
import { useJoinContest, useSpectateContest } from '@/hooks/useJoinContest';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useAuthStore } from '@/stores/authStore';
import {
  formatTimeRange,
  getDurationText,
  formatUserCount,
  getContestActions,
} from '@/utils/contestUtils';
import { Users, Play, Eye, ExternalLink } from 'lucide-react';
import { cn } from '@/utils';

interface ContestCardProps {
  contest: Contest;
  className?: string;
}

const ContestCard: React.FC<ContestCardProps> = ({ contest, className }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const joinContest = useJoinContest();
  const spectateContest = useSpectateContest();
  const confirmDialog = useConfirmDialog();

  const actions = getContestActions(contest, isAuthenticated);

  const handleJoinContest = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const confirmed = await confirmDialog.showConfirm({
      title: 'Join Contest',
      message: `Are you sure you want to join "${contest.name}"? Joining will start your timer and you cannot undo this action.`,
      confirmText: 'Join Contest',
      cancelText: 'Cancel',
      variant: 'warning',
    });

    if (confirmed) {
      joinContest.mutate(contest.id);
    }
  };

  const handleSpectateContest = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    spectateContest.mutate(contest.id);
    navigate(`/contests/${contest.key}`);
  };

  const handleContinueContest = () => {
    navigate(`/contests/${contest.key}`);
  };

  const handleViewContest = () => {
    navigate(`/contests/${contest.key}`);
  };

  return (
    <div
      className={cn(
        'bg-card rounded-lg border p-6 transition-shadow hover:shadow-md',
        className
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground truncate text-lg font-semibold">
            {contest.name}
          </h3>
          {contest.description && (
            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
              {contest.description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="ml-4 flex items-center space-x-2">
          {actions.showLogin && (
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary btn-sm"
            >
              Login to Join
            </button>
          )}

          {actions.showContinue && (
            <button
              onClick={handleContinueContest}
              className="btn btn-primary btn-sm"
            >
              <Play className="mr-1 h-4 w-4" />
              Continue
            </button>
          )}

          {actions.canJoin && (
            <button
              onClick={handleJoinContest}
              disabled={joinContest.isPending}
              className="btn btn-primary btn-sm"
            >
              {joinContest.isPending ? 'Joining...' : 'Join'}
            </button>
          )}

          {actions.canSpectate && (
            <button
              onClick={handleSpectateContest}
              disabled={spectateContest.isPending}
              className="btn btn-outline btn-sm"
            >
              <Eye className="mr-1 h-4 w-4" />
              {spectateContest.isPending ? 'Loading...' : 'Spectate'}
            </button>
          )}

          {actions.showVirtualJoin && (
            <button
              onClick={handleViewContest}
              className="btn btn-outline btn-sm"
            >
              <ExternalLink className="mr-1 h-4 w-4" />
              View
            </button>
          )}
        </div>
      </div>

      {/* Tags */}
      <ContestTags contest={contest} className="mb-4" />

      {/* Time Information */}
      <div className="mb-4 space-y-2">
        <div className="text-muted-foreground text-sm">
          {formatTimeRange(contest.startTime, contest.endTime)}
        </div>
        <div className="text-muted-foreground text-sm">
          Duration: {getDurationText(contest)}
        </div>
        <CountdownTimer contest={contest} />
      </div>

      {/* Footer */}
      <div className="border-border flex items-center justify-between border-t pt-4">
        <div className="text-muted-foreground flex items-center space-x-1 text-sm">
          <Users className="h-4 w-4" />
          <span>{formatUserCount(contest.userCount)} participants</span>
        </div>

        {contest.organizations.length > 0 && (
          <div className="text-muted-foreground text-sm">
            {contest.organizations[0].shortName}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestCard;
