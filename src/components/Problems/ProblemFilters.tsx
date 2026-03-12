import React from 'react';
import { SearchInput } from '@/components/forms/SearchInput';
import { Select } from '@/components/ui/Select';
import { MultiSelect } from '@/components/forms/MultiSelect';
import { Checkbox } from '@/components/ui/Checkbox';
import type { ProblemFilters as Filters, Category, ProblemType } from '@/types';
import { X, Filter } from 'lucide-react';
import { cn } from '@/utils';

interface ProblemFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  categories: Category[];
  types: ProblemType[];
  pointRange: [number, number];
  className?: string;
}

const ProblemFilters: React.FC<ProblemFiltersProps> = ({
  filters,
  onFiltersChange,
  categories,
  types,
  pointRange,
  className,
}) => {
  const updateFilter = (key: keyof Filters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof Filters];
    return (
      value !== undefined &&
      value !== '' &&
      (Array.isArray(value) ? value.length > 0 : true)
    );
  });

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: `${cat.name} (${cat.problemCount})`,
  }));

  const typeOptions = types.map(type => ({
    value: type.id,
    label: type.name,
  }));

  const difficultyOptions = [
    { value: 'Easy', label: 'Easy' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Hard', label: 'Hard' },
  ];

  return (
    <div className={cn('bg-card space-y-6 rounded-lg border p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="text-muted-foreground h-5 w-5" />
          <h3 className="text-lg font-semibold">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground flex items-center space-x-1 text-sm transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div>
        <SearchInput
          value={filters.search || ''}
          onChange={value => updateFilter('search', value)}
          placeholder="Search problems..."
          className="w-full"
        />
      </div>

      {/* Category */}
      <div>
        <label className="mb-2 block text-sm font-medium">Category</label>
        <Select
          value={filters.category || 'all'}
          onChange={e =>
            updateFilter(
              'category',
              e.target.value === 'all' ? undefined : e.target.value
            )
          }
          options={categoryOptions}
          placeholder="Select category"
        />
      </div>

      {/* Difficulty */}
      <div>
        <label className="mb-2 block text-sm font-medium">Difficulty</label>
        <Select
          value={filters.difficulty || ''}
          onChange={e =>
            updateFilter('difficulty', e.target.value || undefined)
          }
          options={[
            { value: '', label: 'All Difficulties' },
            ...difficultyOptions,
          ]}
          placeholder="Select difficulty"
        />
      </div>

      {/* Types */}
      <div>
        <label className="mb-2 block text-sm font-medium">Problem Types</label>
        <MultiSelect
          options={typeOptions}
          value={filters.types || []}
          onChange={value =>
            updateFilter('types', value.length > 0 ? value : undefined)
          }
          placeholder="Select types..."
        />
      </div>

      {/* Point Range */}
      <div>
        <label className="mb-2 block text-sm font-medium">Point Range</label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            min={pointRange[0]}
            max={pointRange[1]}
            value={filters.pointRange?.[0] || pointRange[0]}
            onChange={e => {
              const min = parseInt(e.target.value);
              const max = filters.pointRange?.[1] || pointRange[1];
              updateFilter('pointRange', [min, max]);
            }}
            className="input w-20"
            placeholder="Min"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="number"
            min={pointRange[0]}
            max={pointRange[1]}
            value={filters.pointRange?.[1] || pointRange[1]}
            onChange={e => {
              const max = parseInt(e.target.value);
              const min = filters.pointRange?.[0] || pointRange[0];
              updateFilter('pointRange', [min, max]);
            }}
            className="input w-20"
            placeholder="Max"
          />
        </div>
      </div>

      {/* Boolean Filters */}
      <div className="space-y-3">
        <Checkbox
          label="Show only solved problems"
          checked={filters.showSolved || false}
          onChange={checked => updateFilter('showSolved', checked || undefined)}
        />

        <Checkbox
          label="Hide solved problems"
          checked={filters.hideSolved || false}
          onChange={checked => updateFilter('hideSolved', checked || undefined)}
        />

        <Checkbox
          label="Has editorial"
          checked={filters.hasEditorial || false}
          onChange={checked =>
            updateFilter('hasEditorial', checked || undefined)
          }
        />
      </div>
    </div>
  );
};

export default ProblemFilters;
