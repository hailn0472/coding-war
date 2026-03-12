import React, { useState } from 'react';
import { H1, P } from '@/components/ui/Typography';
import ContestSections from '@/components/Contests/ContestSections';
import { useContests } from '@/hooks/useContests';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useToastContext } from '@/contexts/ToastContext';
import { RefreshCw, AlertCircle } from 'lucide-react';

const ContestList: React.FC = () => {
  const [pastContestsPage, setPastContestsPage] = useState(1);
  const toast = useToastContext();
  const confirmDialog = useConfirmDialog();

  const { data, isLoading, error, refetch, isRefetching } =
    useContests(pastContestsPage);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Contest list refreshed');
    } catch (err) {
      toast.error('Failed to refresh contest list');
    }
  };

  const handlePastContestsPageChange = (page: number) => {
    setPastContestsPage(page);
  };

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="text-foreground mb-2 text-xl font-semibold">
            Failed to load contests
          </h2>
          <p className="text-muted-foreground mb-4">
            There was an error loading the contest list. Please try again.
          </p>
          <button onClick={handleRefresh} className="btn btn-primary btn-md">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <H1 className="mb-2">Contests</H1>
            <P className="text-muted-foreground">
              Participate in programming contests and improve your skills
            </P>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefetching}
            className="btn btn-outline btn-md"
            title="Refresh contest list"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Contest Sections */}
      <ContestSections
        activeContests={data?.activeContests || []}
        ongoingContests={data?.ongoingContests || []}
        upcomingContests={data?.upcomingContests || []}
        pastContests={data?.pastContests || []}
        pastContestsPage={pastContestsPage}
        pastContestsTotalPages={data?.pastContestsTotalPages || 1}
        onPastContestsPageChange={handlePastContestsPageChange}
        loading={isLoading}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={confirmDialog.handleCancel}
        onConfirm={confirmDialog.handleConfirm}
        title={confirmDialog.options?.title}
        message={confirmDialog.options?.message || ''}
        confirmText={confirmDialog.options?.confirmText}
        cancelText={confirmDialog.options?.cancelText}
        variant={confirmDialog.options?.variant}
        loading={confirmDialog.loading}
      />
    </div>
  );
};

export default ContestList;
