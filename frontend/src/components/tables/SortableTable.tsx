import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { cn } from '@/utils';

export interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface SortConfig<T> {
  key: keyof T;
  direction: 'asc' | 'desc';
}

interface SortableTableProps<T> {
  data: T[];
  columns: Column<T>[];
  defaultSort?: SortConfig<T>;
  onRowClick?: (row: T) => void;
  className?: string;
  emptyMessage?: string;
}

export function SortableTable<T extends Record<string, any>>({
  data,
  columns,
  defaultSort,
  onRowClick,
  className,
  emptyMessage = 'No data available',
}: SortableTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(
    defaultSort || null
  );

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;

      if (sortConfig.direction === 'asc') {
        return aValue < bValue ? -1 : 1;
      } else {
        return aValue > bValue ? -1 : 1;
      }
    });
  }, [data, sortConfig]);

  const handleSort = (key: keyof T) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null; // Remove sorting
    });
  };

  const getSortIcon = (key: keyof T) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronsUpDown className="h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  return (
    <div className={cn('rounded-md border', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(column => (
              <TableHead
                key={String(column.key)}
                className={cn(
                  column.headerClassName,
                  column.sortable && 'cursor-pointer select-none'
                )}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center space-x-2">
                  <span>{column.header}</span>
                  {column.sortable && getSortIcon(column.key)}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-muted-foreground h-24 text-center"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((row, index) => (
              <TableRow
                key={index}
                className={cn(
                  onRowClick && 'cursor-pointer',
                  'hover:bg-muted/50'
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map(column => (
                  <TableCell
                    key={String(column.key)}
                    className={column.className}
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : String(row[column.key] || '')}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
