import { useQuery } from '@tanstack/react-query';
import { usersAPI } from '@/api/users';
import type { UserFilters } from '@/components/Users/UserFilters';

interface UseUsersParams extends UserFilters {
  tab?: 'all' | 'top';
}

export const useUsers = (params: UseUsersParams) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersAPI.getUsers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: previousData => previousData, // Replaces keepPreviousData
  });
};
