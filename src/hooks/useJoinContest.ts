import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contestsAPI } from '@/api/contests';
import { useToastContext } from '@/contexts/ToastContext';

export const useJoinContest = () => {
  const queryClient = useQueryClient();
  const toast = useToastContext();

  return useMutation({
    mutationFn: contestsAPI.joinContest,
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      toast.success(data.message);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to join contest');
    },
  });
};

export const useSpectateContest = () => {
  const queryClient = useQueryClient();
  const toast = useToastContext();

  return useMutation({
    mutationFn: contestsAPI.spectateContest,
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      toast.success(data.message);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to spectate contest');
    },
  });
};
