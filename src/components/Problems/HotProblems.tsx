import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Problem } from '@/types';
import {
  formatPoints,
  formatUserCount,
  getProblemStatusIcon,
  getProblemStatusColor,
  getDifficultyColor,
} from '@/utils/problemUtils';
import { TrendingUp, Users } from 'lucide-react';
import { cn } from '@/utils';

interface HotProblemsProps {
  problems: Problem[];
  loading?: boolean;
  className?: string;
}

const HotProblems: React.FC<HotProblemsProps> = ({
  problems,
  loading = false,
  className,
}) => {
  const navigate = useNavigate();

  const handleProblemClick = (problem: Problem) => {
    navigate(`/problems/${problem.code}`);
  };

  if (loading) {
    return (
      <div className={cn('bg-card rounded-lg border p-6', className)}>
        <div className="mb-4 flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold">Hot Problems</h3>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-card rounded-lg border p-6', className)}>
      <div className="mb-4 flex items-center space-x-2">
        <TrendingUp className="h-5 w-5 text-orange-500" />
        <h3 className="text-lg font-semibold">Hot Problems</h3>
      </div>

      <div className="space-y-3">
        {problems.map((problem, index) => (
          <div
            key={problem.id}
            onClick={() => handleProblemClick(problem)}
            className="hover:border-border hover:bg-accent/50 group cursor-pointer rounded-lg border border-transparent p-3 transition-all duration-200"
          >
            <div className="flex items-start space-x-3">
              {/* Rank */}
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600 dark:bg-orange-900 dark:text-orange-400">
                {index + 1}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center space-x-2">
                  <span
                    className={cn(
                      'text-sm font-bold',
                      getProblemStatusColor(problem.solvedStatus)
                    )}
                  >
                    {getProblemStatusIcon(problem.solvedStatus)}
                  </span>
                  <span className="font-mono text-xs text-primary-600 dark:text-primary-400">
                    {problem.code}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium',
                      getDifficultyColor(problem.difficulty)
                    )}
                  >
                    {problem.difficulty}
                  </span>
                </div>

                <h4 className="text-foreground truncate text-sm font-medium transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400">
                  {problem.name}
                </h4>

                <div className="text-muted-foreground mt-2 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{formatUserCount(problem.userCount)}</span>
                  </div>
                  <span className="font-medium">
                    {formatPoints(problem.points, problem.partial)} pts
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {problems.length === 0 && (
        <div className="text-muted-foreground py-8 text-center">
          <TrendingUp className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p className="text-sm">No hot problems available</p>
        </div>
      )}
    </div>
  );
};

export default HotProblems;
