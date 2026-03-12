import React, { useState } from 'react';
import { useUsers } from '@/hooks/useUsers';
import { useUserFilters } from '@/hooks/useUserFilters';
import UserTable from '@/components/Users/UserTable';
import UserFilters from '@/components/Users/UserFilters';
import { Loader2, Users, Trophy, Search } from 'lucide-react';

const UserList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'top'>('all');
  const { filters, updateFilters, resetFilters } = useUserFilters();

  const {
    data: usersData,
    isLoading,
    error,
  } = useUsers({
    ...filters,
    tab: activeTab,
  });

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">
          <Users className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="text-foreground mb-2 text-xl font-semibold">
            Failed to load users
          </h2>
          <p className="text-muted-foreground">
            There was an error loading the user list. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-foreground text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground mt-2">
          Browse user profiles and rankings
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-border border-b">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === 'all'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'text-muted-foreground hover:text-foreground border-transparent hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>All Users</span>
                {usersData && (
                  <span className="bg-accent text-accent-foreground rounded-full px-2 py-1 text-xs">
                    {usersData.totalCount}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('top')}
              className={`border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === 'top'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'text-muted-foreground hover:text-foreground border-transparent hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Trophy className="h-4 w-4" />
                <span>Top Rated</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Filters */}
      <UserFilters
        filters={filters}
        onFiltersChange={updateFilters}
        onReset={resetFilters}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex min-h-96 items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary-600" />
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
      )}

      {/* Users Table */}
      {!isLoading && usersData && (
        <UserTable
          users={usersData.users}
          totalCount={usersData.totalCount}
          currentPage={filters.page || 1}
          pageSize={filters.pageSize || 50}
          onPageChange={(page: number) => updateFilters({ page })}
          showRanking={activeTab === 'top'}
        />
      )}

      {/* Empty State */}
      {!isLoading && usersData?.users.length === 0 && (
        <div className="bg-card rounded-lg border p-12 text-center">
          <Search className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="text-foreground mb-2 text-lg font-medium">
            No users found
          </h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search criteria or filters.
          </p>
          <button onClick={resetFilters} className="btn btn-outline btn-sm">
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};

export default UserList;
