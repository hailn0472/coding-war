import React, { useState, useMemo } from 'react';
import { SortableTable, type Column, type SortConfig } from './SortableTable';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/forms/SearchInput';
import { cn } from '@/utils';

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  paginated?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  defaultSort?: SortConfig<T>;
  onRowClick?: (row: T) => void;
  className?: string;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = false,
  searchPlaceholder = 'Search...',
  searchKeys,
  paginated = false,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  defaultSort,
  onRowClick,
  className,
  emptyMessage,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchable || !searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    const keysToSearch =
      searchKeys || (Object.keys(data[0] || {}) as (keyof T)[]);

    return data.filter(row =>
      keysToSearch.some(key => {
        const value = row[key];
        return String(value || '')
          .toLowerCase()
          .includes(query);
      })
    );
  }, [data, searchQuery, searchable, searchKeys]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!paginated) return filteredData;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, paginated, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(Number(newPageSize));
    setCurrentPage(1);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and controls */}
      {(searchable || paginated) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {searchable && (
            <div className="max-w-sm flex-1">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={searchPlaceholder}
              />
            </div>
          )}

          {paginated && (
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground text-sm">
                Rows per page:
              </span>
              <Select
                value={String(pageSize)}
                onChange={e => handlePageSizeChange(e.target.value)}
                options={pageSizeOptions.map(size => ({
                  value: String(size),
                  label: String(size),
                }))}
                className="w-20"
              />
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <SortableTable
        data={paginatedData}
        columns={columns}
        defaultSort={defaultSort}
        onRowClick={onRowClick}
        emptyMessage={emptyMessage}
      />

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="text-muted-foreground text-sm">
            Showing{' '}
            {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)} to{' '}
            {Math.min(currentPage * pageSize, filteredData.length)} of{' '}
            {filteredData.length} entries
            {searchQuery && ` (filtered from ${data.length} total entries)`}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
