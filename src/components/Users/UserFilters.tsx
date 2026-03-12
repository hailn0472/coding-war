import React from 'react';
import { SearchInput } from '@/components/forms/SearchInput';
import { Select } from '@/components/ui/Select';
import { X, Filter } from 'lucide-react';

export interface UserFilters {
  search?: string;
  organization?: string;
  ratingMin?: number;
  ratingMax?: number;
  page?: number;
  pageSize?: number;
  sortBy?: 'rating' | 'username' | 'problems_solved' | 'last_login';
  sortOrder?: 'asc' | 'desc';
}

interface UserFiltersProps {
  filters: UserFilters;
  onFiltersChange: (filters: Partial<UserFilters>) => void;
  onReset: () => void;
}

const UserFilters: React.FC<UserFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
}) => {
  const hasActiveFilters = Boolean(
    filters.search ||
    filters.organization ||
    filters.ratingMin ||
    filters.ratingMax
  );

  return (
    <div className="bg-card mb-6 rounded-lg border p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="text-muted-foreground h-4 w-4" />
          <h3 className="text-foreground font-medium">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button onClick={onReset} className="btn btn-outline btn-sm">
            <X className="mr-1 h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <SearchInput
            placeholder="Search users..."
            value={filters.search || ''}
            onChange={value => onFiltersChange({ search: value, page: 1 })}
            className="w-full"
          />
        </div>

        {/* Organization */}
        <div>
          <Select
            value={filters.organization || ''}
            onChange={e =>
              onFiltersChange({
                organization: e.target.value || undefined,
                page: 1,
              })
            }
            placeholder="All Organizations"
            options={[
              { value: '', label: 'All Organizations' },
              { value: 'dmoj', label: 'DMOJ' },
              { value: 'university', label: 'Universities' },
              { value: 'high-school', label: 'High Schools' },
              { value: 'company', label: 'Companies' },
            ]}
          />
        </div>

        {/* Sort By */}
        <div>
          <Select
            value={filters.sortBy || 'rating'}
            onChange={e =>
              onFiltersChange({
                sortBy: e.target.value as UserFilters['sortBy'],
                page: 1,
              })
            }
            options={[
              { value: 'rating', label: 'Sort by Rating' },
              { value: 'username', label: 'Sort by Username' },
              { value: 'problems_solved', label: 'Sort by Problems' },
              { value: 'last_login', label: 'Sort by Activity' },
            ]}
          />
        </div>
      </div>

      {/* Rating Range */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-muted-foreground mb-1 block text-sm font-medium">
            Min Rating
          </label>
          <input
            type="number"
            min="0"
            max="3000"
            step="50"
            value={filters.ratingMin || ''}
            onChange={e =>
              onFiltersChange({
                ratingMin: e.target.value
                  ? parseInt(e.target.value)
                  : undefined,
                page: 1,
              })
            }
            placeholder="0"
            className="input w-full"
          />
        </div>
        <div>
          <label className="text-muted-foreground mb-1 block text-sm font-medium">
            Max Rating
          </label>
          <input
            type="number"
            min="0"
            max="3000"
            step="50"
            value={filters.ratingMax || ''}
            onChange={e =>
              onFiltersChange({
                ratingMax: e.target.value
                  ? parseInt(e.target.value)
                  : undefined,
                page: 1,
              })
            }
            placeholder="3000"
            className="input w-full"
          />
        </div>
      </div>

      {/* Sort Order */}
      <div className="mt-4">
        <div className="flex items-center space-x-4">
          <span className="text-muted-foreground text-sm font-medium">
            Sort Order:
          </span>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="sortOrder"
              value="desc"
              checked={filters.sortOrder !== 'asc'}
              onChange={() => onFiltersChange({ sortOrder: 'desc', page: 1 })}
              className="radio"
            />
            <span className="text-foreground text-sm">Descending</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="sortOrder"
              value="asc"
              checked={filters.sortOrder === 'asc'}
              onChange={() => onFiltersChange({ sortOrder: 'asc', page: 1 })}
              className="radio"
            />
            <span className="text-foreground text-sm">Ascending</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default UserFilters;
