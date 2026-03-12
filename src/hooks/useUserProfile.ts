import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '@/api/users';
import { useToastContext } from '@/contexts/ToastContext';
import type { UserProfile } from '@/types';

export const useUserProfile = (username: string) => {
  return useQuery({
    queryKey: ['user-profile', username],
    queryFn: () => usersAPI.getProfile(username),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!username,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const toast = useToastContext();

  return useMutation({
    mutationFn: ({
      username,
      updates,
    }: {
      username: string;
      updates: Partial<UserProfile>;
    }) => usersAPI.updateProfile(username, updates),
    onSuccess: data => {
      queryClient.setQueryData(['user-profile', data.username], data);
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Profile updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });
};

export const useUserSubmissions = (
  username: string,
  page = 1,
  pageSize = 20
) => {
  return useQuery({
    queryKey: ['user-submissions', username, page, pageSize],
    queryFn: () => usersAPI.getSubmissions(username, page, pageSize),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!username,
  });
};

export const useUserContests = (username: string) => {
  return useQuery({
    queryKey: ['user-contests', username],
    queryFn: () => usersAPI.getContestParticipations(username),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!username,
  });
};

export const useUserActivity = (username: string) => {
  return useQuery({
    queryKey: ['user-activity', username],
    queryFn: () => usersAPI.getProblemActivity(username),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!username,
  });
};
