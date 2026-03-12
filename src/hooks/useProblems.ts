import { useQuery } from '@tanstack/react-query';
import { problemsAPI } from '@/api/problems';
import type { ProblemFilters } from '@/types';

export const useProblems = (
  filters: ProblemFilters = {},
  page = 1,
  pageSize = 10
) => {
  return useQuery({
    queryKey: ['problems', filters, page, pageSize],
    queryFn: () => problemsAPI.getProblems(filters, page, pageSize),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
