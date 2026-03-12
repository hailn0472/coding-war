import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { H1, P } from '@/components/ui/Typography';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import ProblemTable from '@/components/Problems/ProblemTable';
import ProblemFilters from '@/components/Problems/ProblemFilters';
import HotProblems from '@/components/Problems/HotProblems';
import { useProblems } from '@/hooks/useProblems';
import { useProblemsURL } from '@/hooks/useProblemsURL';
import { useProblemFilters } from '@/hooks/useProblemFilters';
import { useToastContext } from '@/contexts/ToastContext';
import type { Problem } from '@/types';
import { Search, Filter, Grid, List } from 'lucide-react';
import { cn } from '@/utils';

const ProblemList: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToastContext();

  // URL state management
  const {
    filters: urlFilters,
    page: urlPage,
    pageSize: urlPageSize,
    updateFilters,
  } = useProblemsURL();

  // Local filter state
  const { filters, updateFilters: updateLocalFilters } =
    useProblemFilters(urlFilters);

  // View state
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showFilters, setShowFilters] = useState(true);

  // Data fetching
  const { data, isLoading, error } = useProblems(
    urlFilters,
    urlPage,
    urlPageSize
  );

  // Sync local filters with URL when URL changes
  useEffect(() => {
    updateLocalFilters(urlFilters);
  }, [urlFilters, updateLocalFilters]);

  // Handle filter changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateFilters(filters, 1, urlPageSize);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, updateFilters, urlPageSize]);

  const handlePageChange = (page: number) => {
    updateFilters(urlFilters, page, urlPageSize);
  };

  const handlePageSizeChange = (newPageSize: string) => {
    const size = parseInt(newPageSize);
    updateFilters(urlFilters, 1, size);
  };

  const handleProblemClick = (problem: Problem) => {
    navigate(`/problems/${problem.code}`);
  };

  if (error) {
    toast.error('Failed to load problems. Please try again.');
  }

  const totalPages = data ? Math.ceil(data.totalCount / urlPageSize) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <H1 className="mb-2">Problems</H1>
            <P className="text-muted-foreground">
              {data
                ? `${data.totalCount} problems available`
                : 'Browse and solve programming problems'}
            </P>
          </div>

          {/* View Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'rounded-md border p-2 transition-colors',
                showFilters
                  ? 'border-primary-200 bg-primary-50 text-primary-600 dark:border-primary-700 dark:bg-primary-900 dark:text-primary-400'
                  : 'border-border hover:bg-accent'
              )}
              title="Toggle filters"
            >
              <Filter className="h-4 w-4" />
            </button>

            <div className="border-border flex overflow-hidden rounded-md border">
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'table'
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
                    : 'hover:bg-accent'
                )}
                title="Table view"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'border-border border-l p-2 transition-colors',
                  viewMode === 'grid'
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
                    : 'hover:bg-accent'
                )}
                title="Grid view"
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-80 flex-shrink-0">
            <div className="sticky top-6 space-y-6">
              <ProblemFilters
                filters={filters}
                onFiltersChange={updateLocalFilters}
                categories={data?.categories || []}
                types={data?.types || []}
                pointRange={data?.pointRange || [0, 500]}
              />

              {/* Hot Problems */}
              <HotProblems
                problems={data?.hotProblems || []}
                loading={isLoading}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="min-w-0 flex-1">
          {/* Results Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-muted-foreground text-sm">
                {isLoading ? (
                  'Loading...'
                ) : data ? (
                  <>
                    Showing{' '}
                    {Math.min((urlPage - 1) * urlPageSize + 1, data.totalCount)}{' '}
                    to {Math.min(urlPage * urlPageSize, data.totalCount)} of{' '}
                    {data.totalCount} problems
                  </>
                ) : (
                  'No problems found'
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground text-sm">Show:</span>
              <Select
                value={urlPageSize.toString()}
                onChange={e => handlePageSizeChange(e.target.value)}
                options={[
                  { value: '10', label: '10' },
                  { value: '25', label: '25' },
                  { value: '50', label: '50' },
                  { value: '100', label: '100' },
                ]}
                className="w-20"
              />
            </div>
          </div>

          {/* Problem Table */}
          <div className="bg-card rounded-lg border">
            <ProblemTable
              problems={data?.problems || []}
              loading={isLoading}
              onRowClick={handleProblemClick}
            />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={urlPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && data?.problems.length === 0 && (
            <div className="py-12 text-center">
              <Search className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <h3 className="text-foreground mb-2 text-lg font-medium">
                No problems found
              </h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or filters
              </p>
              <button
                onClick={() => updateLocalFilters({})}
                className="btn btn-outline btn-md"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemList;
