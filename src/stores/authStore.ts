import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  isStaff: boolean;
  isSuperuser: boolean;
  rating: number;
  maxRating: number;
  joinDate: Date;
  lastLogin?: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        try {
          // TODO: Implement actual API call
          // For now, simulate login
          const mockUser: User = {
            id: '1',
            username: credentials.username,
            email: `${credentials.username}@example.com`,
            displayName: credentials.username,
            isStaff: false,
            isSuperuser: false,
            rating: 1200,
            maxRating: 1200,
            joinDate: new Date(),
            lastLogin: new Date(),
          };

          set({
            user: mockUser,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true });
        try {
          // TODO: Implement actual API call
          // For now, simulate registration
          const mockUser: User = {
            id: '1',
            username: data.username,
            email: data.email,
            displayName: data.username,
            isStaff: false,
            isSuperuser: false,
            rating: 1200,
            maxRating: 1200,
            joinDate: new Date(),
          };

          set({
            user: mockUser,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: state => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
