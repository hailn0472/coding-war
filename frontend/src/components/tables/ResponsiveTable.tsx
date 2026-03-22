import React from 'react';
import { cn } from '@/utils';
import { Card } from '@/components/ui/Card';

interface ResponsiveColumn<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  mobileLabel?: string;
  hideOnMobile?: boolean;
  priority?: number; // Lower numbers show first on mobile
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: ResponsiveColumn<T>[];
  onRowClick?: (row: T) => void;
  className?: string;
  emptyMessage?: string;
  mobileBreakpoint?: string;
}

export function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  className,
  emptyMessage = 'No data available',
  mobileBreakpoint = 'md',
}: ResponsiveTableProps<T>) {
  const sortedColumns = [...columns].sort(
    (a, b) => (a.priority || 999) - (b.priority || 999)
  );
  const mobileColumns = sortedColumns.filter(col => !col.hideOnMobile);

  return (
    <div className={className}>
      {/* Desktop Table */}
      <div className={cn('hidden', `${mobileBreakpoint}:block`)}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                {columns.map(column => (
                  <th
                    key={String(column.key)}
                    className="text-muted-foreground px-4 py-3 text-left font-medium"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-muted-foreground px-4 py-8 text-center"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr
                    key={index}
                    className={cn(
                      'hover:bg-muted/50 border-b transition-colors',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map(column => (
                      <td key={String(column.key)} className="px-4 py-3">
                        {column.render
                          ? column.render(row[column.key], row)
                          : String(row[column.key] || '')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className={cn('space-y-3', `${mobileBreakpoint}:hidden`)}>
        {data.length === 0 ? (
          <Card className="text-muted-foreground p-8 text-center">
            {emptyMessage}
          </Card>
        ) : (
          data.map((row, index) => (
            <Card
              key={index}
              className={cn(
                'space-y-2 p-4',
                onRowClick && 'hover:bg-muted/50 cursor-pointer'
              )}
              onClick={() => onRowClick?.(row)}
            >
              {mobileColumns.map(column => {
                const value = row[column.key];
                const displayValue = column.render
                  ? column.render(value, row)
                  : String(value || '');

                return (
                  <div
                    key={String(column.key)}
                    className="flex items-start justify-between"
                  >
                    <span className="text-muted-foreground mr-2 min-w-0 flex-shrink-0 text-sm font-medium">
                      {column.mobileLabel || column.header}:
                    </span>
                    <span className="min-w-0 flex-1 text-right text-sm">
                      {displayValue}
                    </span>
                  </div>
                );
              })}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
