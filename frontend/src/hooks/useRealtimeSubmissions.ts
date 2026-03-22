import { useState, useEffect } from 'react';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { useToast } from '@/hooks/useToast';
import type { SubmissionUpdate } from '@/types';

export const useSubmissionUpdates = (submissionId?: string) => {
  const { subscribe, unsubscribe } = useWebSocket();
  const { showToast } = useToast();
  const [status, setStatus] = useState<SubmissionUpdate['status'] | null>(null);

  useEffect(() => {
    if (!submissionId) return;

    const handleUpdate = (data: SubmissionUpdate) => {
      if (data.submissionId === submissionId) {
        setStatus(data.status);

        // Show notification for final results
        if (data.status.isFinal) {
          showToast({
            variant: data.status.result === 'AC' ? 'success' : 'error',
            title: `Submission ${data.status.result}`,
            message: `Problem ${data.problemCode}: ${data.status.result}`,
            duration: 5000,
          });
        }
      }
    };

    subscribe('submission_update', handleUpdate);
    return () => unsubscribe('submission_update', handleUpdate);
  }, [submissionId, subscribe, unsubscribe, showToast]);

  return status;
};

export const useSubmissionQueue = () => {
  const { subscribe, unsubscribe } = useWebSocket();
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState<number | null>(
    null
  );

  useEffect(() => {
    const handleQueueUpdate = (data: {
      position: number;
      estimatedWait: number;
    }) => {
      setQueuePosition(data.position);
      setEstimatedWaitTime(data.estimatedWait);
    };

    subscribe('submission_update', handleQueueUpdate);
    return () => unsubscribe('submission_update', handleQueueUpdate);
  }, [subscribe, unsubscribe]);

  return { queuePosition, estimatedWaitTime };
};
