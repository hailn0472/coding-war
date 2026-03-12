import React from 'react';
import type { Contest } from '@/types';
import ContestCard from './ContestCard';
import { Pagination } from '@/components/ui/Pagination';
import { Trophy, Clock, Calendar, History } from 'lucide-react';

interface ContestSectionsProps {
  activeContests: Contest[];
  ongoingContests: Contest[];
  upcomingContests: Contest[];
  pastContests: Contest[];
  pastContestsPage: number;
  pastContestsTotalPages: number;
  onPastContestsPageChange: (page: number) => void;
  loading?: boolean;
}

const ContestSections: React.FC<ContestSectionsProps> = ({
  activeContests,
  ongoingContests,
  upcomingContests,
  pastContests,
  pastContestsPage,
  pastContestsTotalPages,
  onPastContestsPageChange,
  loading = false,
}) => {
  const SectionHeader: React.FC<{
    icon: React.ReactNode;
    title: string;
    count: number;
    description?: string;
  }> = ({ icon, title, count, description }) => (
    <div className="mb-6 flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        {icon}
        <h2 className="text-foreground text-xl font-semibold">{title}</h2>
        <span className="rounded-full bg-primary-100 px-2 py-1 text-sm font-medium text-primary-600 dark:bg-primary-900 dark:text-primary-400">
          {count}
        </span>
      </div>
      {description && (
        <span className="text-muted-foreground text-sm">{description}</span>
      )}
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-32 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
        </div>
      ))}
    </div>
  );

  const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <div className="text-muted-foreground py-8 text-center">
      <p>{message}</p>
    </div>
  );

  return (
    <div className="space-y-12">
      {/* Active Contests */}
      {activeContests.length > 0 && (
        <section>
          <SectionHeader
            icon={<Trophy className="h-6 w-6 text-green-600" />}
            title="Active Contests"
            count={activeContests.length}
            description="Contests you are currently participating in"
          />
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              {activeContests.map(contest => (
                <ContestCard key={contest.id} contest={contest} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Ongoing Contests */}
      {ongoingContests.length > 0 && (
        <section>
          <SectionHeader
            icon={<Clock className="h-6 w-6 text-blue-600" />}
            title="Ongoing Contests"
            count={ongoingContests.length}
            description="Contests currently running that you can join"
          />
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              {ongoingContests.map(contest => (
                <ContestCard key={contest.id} contest={contest} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Upcoming Contests */}
      <section>
        <SectionHeader
          icon={<Calendar className="h-6 w-6 text-orange-600" />}
          title="Upcoming Contests"
          count={upcomingContests.length}
          description="Contests scheduled to start soon"
        />
        {loading ? (
          <LoadingSkeleton />
        ) : upcomingContests.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            {upcomingContests.map(contest => (
              <ContestCard key={contest.id} contest={contest} />
            ))}
          </div>
        ) : (
          <EmptyState message="No upcoming contests scheduled." />
        )}
      </section>

      {/* Past Contests */}
      <section>
        <SectionHeader
          icon={<History className="h-6 w-6 text-gray-600" />}
          title="Past Contests"
          count={pastContests.length}
          description="Previous contests available for virtual participation"
        />
        {loading ? (
          <LoadingSkeleton />
        ) : pastContests.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              {pastContests.map(contest => (
                <ContestCard key={contest.id} contest={contest} />
              ))}
            </div>

            {/* Pagination for Past Contests */}
            {pastContestsTotalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={pastContestsPage}
                  totalPages={pastContestsTotalPages}
                  onPageChange={onPastContestsPageChange}
                />
              </div>
            )}
          </>
        ) : (
          <EmptyState message="No past contests available." />
        )}
      </section>
    </div>
  );
};

export default ContestSections;
