import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/tables/DataTable';
import type { Problem } from '@/types';
import {
  formatPoints,
  formatAcceptanceRate,
  formatUserCount,
  getProblemStatusIcon,
  getProblemStatusColor,
  getDifficultyColor,
  getTypeColor,
} from '@/utils/problemUtils';
import { BookOpen, Users } from 'lucide-react';
import { cn } from '@/utils';

interface ProblemTableProps {
  problems: Problem[];
  loading?: boolean;
  onRowClick?: (problem: Problem) => void;
}

const ProblemTable: React.FC<ProblemTableProps> = ({
  problems,
  loading = false,
  onRowClick,
}) => {
  const navigate = useNavigate();

  const handleRowClick = (problem: Problem) => {
    if (onRowClick) {
      onRowClick(problem);
    } else {
      navigate(`/problems/${problem.code}`);
    }
  };

  const columns = [
    {
      key: 'id' as keyof Problem,
      header: '',
      sortable: false,
      render: (_value: any, problem: Problem) => (
        <div className="flex w-6 items-center justify-center">
          <span
            className={cn(
              'text-lg font-bold',
              getProblemStatusColor(problem.solvedStatus)
            )}
            title={problem.solvedStatus || 'unsolved'}
          >
            {getProblemStatusIcon(problem.solvedStatus)}
          </span>
        </div>
      ),
    },
    {
      key: 'code' as keyof Problem,
      header: 'Code',
      sortable: true,
      render: (value: any) => (
        <span className="font-mono text-sm font-medium text-primary-600 dark:text-primary-400">
          {value}
        </span>
      ),
    },
    {
      key: 'name' as keyof Problem,
      header: 'Problem Name',
      sortable: true,
      render: (value: any, problem: Problem) => (
        <div className="min-w-0">
          <div className="text-foreground truncate font-medium">{value}</div>
          <div className="text-muted-foreground truncate text-sm">
            {problem.group.name}
          </div>
        </div>
      ),
    },
    {
      key: 'difficulty' as keyof Problem,
      header: 'Difficulty',
      sortable: true,
      render: (value: any) => (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            getDifficultyColor(value)
          )}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'types' as keyof Problem,
      header: 'Types',
      sortable: false,
      render: (value: any) => (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 2).map((type: string) => (
            <span
              key={type}
              className={cn(
                'inline-flex items-center rounded px-2 py-1 text-xs font-medium',
                getTypeColor(type)
              )}
            >
              {type}
            </span>
          ))}
          {value.length > 2 && (
            <span className="text-muted-foreground text-xs">
              +{value.length - 2}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'points' as keyof Problem,
      header: 'Points',
      sortable: true,
      render: (value: any, problem: Problem) => (
        <span className="font-medium">
          {formatPoints(value, problem.partial)}
        </span>
      ),
    },
    {
      key: 'acRate' as keyof Problem,
      header: 'AC Rate',
      sortable: true,
      render: (value: any) => (
        <span className="text-sm">{formatAcceptanceRate(value)}</span>
      ),
    },
    {
      key: 'userCount' as keyof Problem,
      header: 'Users',
      sortable: true,
      render: (value: any) => (
        <div className="flex items-center space-x-1">
          <Users className="text-muted-foreground h-4 w-4" />
          <span className="text-sm">{formatUserCount(value)}</span>
        </div>
      ),
    },
    {
      key: 'hasPublicEditorial' as keyof Problem,
      header: 'Editorial',
      sortable: true,
      render: (value: any) => (
        <div className="flex justify-center">
          {value ? (
            <BookOpen
              className="h-4 w-4 text-blue-500"
              aria-label="Has editorial"
            />
          ) : (
            <span className="text-gray-300 dark:text-gray-600">—</span>
          )}
        </div>
      ),
    },
  ];
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-12 rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DataTable
      data={problems}
      columns={columns}
      onRowClick={handleRowClick}
      emptyMessage="No problems found. Try adjusting your filters."
      className="cursor-pointer"
    />
  );
};

export default ProblemTable;
