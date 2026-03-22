import { useQuery } from '@tanstack/react-query';
import { contestsAPI } from '@/api/contests';

export const useContests = (page = 1, pageSize = 10) => {
  return useQuery({
    queryKey: ['contests', page, pageSize],
    queryFn: () => contestsAPI.getContests(page, pageSize),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
};
