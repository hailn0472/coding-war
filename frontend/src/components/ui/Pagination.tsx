import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisiblePages?: number;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showPrevNext = true,
  maxVisiblePages = 5,
  className,
}) => {
  const getVisiblePages = () => {
    const pages: (number | 'ellipsis')[] = [];

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, currentPage + halfVisible);

      // Adjust if we're near the beginning or end
      if (currentPage <= halfVisible) {
        endPage = maxVisiblePages;
      } else if (currentPage > totalPages - halfVisible) {
        startPage = totalPages - maxVisiblePages + 1;
      }

      // Add first page and ellipsis if needed
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push('ellipsis');
        }
      }

      // Add visible pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis and last page if needed
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('ellipsis');
        }
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <nav
      className={cn('flex items-center justify-center space-x-1', className)}
      aria-label="Pagination"
    >
      {/* First page button */}
      {showFirstLast && (
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="border-input bg-background hover:bg-accent hover:text-accent-foreground flex h-9 w-9 items-center justify-center rounded-md border disabled:pointer-events-none disabled:opacity-50"
          aria-label="Go to first page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
      )}

      {/* Previous page button */}
      {showPrevNext && (
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="border-input bg-background hover:bg-accent hover:text-accent-foreground flex h-9 w-9 items-center justify-center rounded-md border disabled:pointer-events-none disabled:opacity-50"
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Page numbers */}
      {visiblePages.map((page, index) => (
        <React.Fragment key={index}>
          {page === 'ellipsis' ? (
            <span className="flex h-9 w-9 items-center justify-center">
              <MoreHorizontal className="h-4 w-4" />
            </span>
          ) : (
            <button
              onClick={() => onPageChange(page)}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium',
                page === currentPage
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
              )}
              aria-label={`Go to page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}

      {/* Next page button */}
      {showPrevNext && (
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="border-input bg-background hover:bg-accent hover:text-accent-foreground flex h-9 w-9 items-center justify-center rounded-md border disabled:pointer-events-none disabled:opacity-50"
          aria-label="Go to next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Last page button */}
      {showFirstLast && (
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="border-input bg-background hover:bg-accent hover:text-accent-foreground flex h-9 w-9 items-center justify-center rounded-md border disabled:pointer-events-none disabled:opacity-50"
          aria-label="Go to last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      )}
    </nav>
  );
};
