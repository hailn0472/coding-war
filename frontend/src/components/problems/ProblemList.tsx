import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';
import Badge from '../ui/Badge';
import type { Problem } from '../../types/api';

export interface ProblemListProps {
  problems: Problem[];
  onProblemClick: (problemId: string) => void;
}

export default function ProblemList({ problems, onProblemClick }: ProblemListProps) {
  const difficultyVariant = {
    easy: 'easy' as const,
    medium: 'medium' as const,
    hard: 'hard' as const,
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Difficulty</TableHead>
          <TableHead>Acceptance Rate</TableHead>
          <TableHead>Tags</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {problems.map((problem) => (
          <TableRow
            key={problem.id}
            onClick={() => onProblemClick(problem.id)}
          >
            <TableCell>
              <span className="font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                {problem.title}
              </span>
            </TableCell>
            <TableCell>
              <Badge variant={difficultyVariant[problem.difficulty]} size="sm">
                {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
              </Badge>
            </TableCell>
            <TableCell>
              <span className="text-gray-700 dark:text-gray-300">
                {problem.acceptanceRate.toFixed(1)}%
              </span>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {problem.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="gray" size="sm">
                    {tag}
                  </Badge>
                ))}
                {problem.tags.length > 3 && (
                  <Badge variant="gray" size="sm">
                    +{problem.tags.length - 3}
                  </Badge>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
