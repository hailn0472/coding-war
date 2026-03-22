import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/auth';

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
  confirmPassword?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<{ message: string; userId: string }>;
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
          // Call actual API
          const response = await authApi.login({
            emailOrUsername: credentials.username,
            password: credentials.password,
          });

          // Store tokens
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);

          // Map API user to store user
          const user: User = {
            id: response.user.id,
            username: response.user.username,
            email: response.user.email,
            displayName: response.user.username,
            isStaff: response.user.role === 'ADMIN',
            isSuperuser: response.user.role === 'ADMIN',
            rating: 1200,
            maxRating: 1200,
            joinDate: new Date(),
            lastLogin: new Date(),
          };

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        // Clear tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true });
        try {
          // Call actual API - only send required fields
          const response = await authApi.register({
            username: data.username,
            email: data.email,
            password: data.password,
          });

          // Registration successful - user needs to verify email
          // Don't auto-login, just clear loading state
          set({
            isLoading: false,
          });
          
          return response;
        } catch (error: any) {
          set({ isLoading: false });
          // Re-throw with better error message
          if (error.response?.data) {
            throw new Error(error.response.data.message || 'Registration failed');
          }
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
