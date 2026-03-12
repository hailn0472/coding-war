import { useState, useEffect } from 'react';
import { useWebSocket } from '@/providers/WebSocketProvider';
import type { LeaderboardEntry, LeaderboardUpdate } from '@/types';

export const useContestLeaderboard = (contestId: string) => {
  const { subscribe, unsubscribe } = useWebSocket();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const handleUpdate = (data: LeaderboardUpdate) => {
      if (data.contestId === contestId) {
        setLeaderboard(prev => {
          const updated = [...prev];
          data.changes.forEach(change => {
            const index = updated.findIndex(
              entry => entry.userId === change.userId
            );
            if (index >= 0) {
              updated[index] = { ...updated[index], ...change };
            } else if (change.userId) {
              // Add new entry
              updated.push(change as LeaderboardEntry);
            }
          });
          return updated.sort((a, b) => b.score - a.score);
        });
        setLastUpdate(new Date());
      }
    };

    subscribe('leaderboard_update', handleUpdate);
    return () => unsubscribe('leaderboard_update', handleUpdate);
  }, [contestId, subscribe, unsubscribe]);

  return { leaderboard, lastUpdate };
};

export const useContestUpdates = (contestId: string) => {
  const { subscribe, unsubscribe } = useWebSocket();
  const [participantCount, setParticipantCount] = useState<number | null>(null);
  const [announcements, setAnnouncements] = useState<string[]>([]);

  useEffect(() => {
    const handleContestUpdate = (data: {
      contestId: string;
      participantCount?: number;
      announcement?: string;
    }) => {
      if (data.contestId === contestId) {
        if (data.participantCount !== undefined) {
          setParticipantCount(data.participantCount);
        }
        if (data.announcement) {
          setAnnouncements(prev => [data.announcement!, ...prev.slice(0, 9)]);
        }
      }
    };

    subscribe('contest_update', handleContestUpdate);
    return () => unsubscribe('contest_update', handleContestUpdate);
  }, [contestId, subscribe, unsubscribe]);

  return { participantCount, announcements };
};
