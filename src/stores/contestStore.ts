import { create } from 'zustand';

export interface Contest {
  id: string;
  key: string;
  name: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  timeLimit?: number;
  isVisible: boolean;
  isPrivate: boolean;
  isRated: boolean;
  userCount: number;
  timeRemaining?: number;
  isSpectating?: boolean;
  isVirtual?: boolean;
}

interface ContestState {
  activeContest: Contest | null;
  contests: Contest[];
  isLoading: boolean;
  setActiveContest: (contest: Contest | null) => void;
  setContests: (contests: Contest[]) => void;
  joinContest: (contestKey: string) => Promise<void>;
  leaveContest: () => void;
}

export const useContestStore = create<ContestState>(set => ({
  activeContest: null,
  contests: [],
  isLoading: false,

  setActiveContest: (contest: Contest | null) => {
    set({ activeContest: contest });
  },

  setContests: (contests: Contest[]) => {
    set({ contests });
  },

  joinContest: async (contestKey: string) => {
    set({ isLoading: true });
    try {
      // TODO: Implement actual API call
      // For now, simulate joining contest
      const mockContest: Contest = {
        id: '1',
        key: contestKey,
        name: 'Sample Contest',
        startTime: new Date(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        isVisible: true,
        isPrivate: false,
        isRated: true,
        userCount: 100,
        timeRemaining: 7200, // 2 hours in seconds
        isSpectating: false,
        isVirtual: false,
      };

      set({
        activeContest: mockContest,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  leaveContest: () => {
    set({ activeContest: null });
  },
}));
