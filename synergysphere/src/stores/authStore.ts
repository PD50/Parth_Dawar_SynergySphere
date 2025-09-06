import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  immer((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (data: LoginData) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Login failed');
        }

        set((state) => {
          state.user = result.user;
          state.isAuthenticated = true;
          state.isLoading = false;
          state.error = null;
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Login failed';
          state.isLoading = false;
          state.isAuthenticated = false;
          state.user = null;
        });
        throw error;
      }
    },

    register: async (data: RegisterData) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Registration failed');
        }

        set((state) => {
          state.user = result.user;
          state.isAuthenticated = true;
          state.isLoading = false;
          state.error = null;
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Registration failed';
          state.isLoading = false;
          state.isAuthenticated = false;
          state.user = null;
        });
        throw error;
      }
    },

    logout: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
        });

        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
          state.isLoading = false;
          state.error = null;
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Logout failed';
          state.isLoading = false;
        });
        // Still clear user data even if logout request fails
        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
        });
        throw error;
      }
    },

    refreshAuth: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await fetch('/api/auth/me');

        if (!response.ok) {
          // If unauthorized, clear auth state
          if (response.status === 401) {
            set((state) => {
              state.user = null;
              state.isAuthenticated = false;
              state.isLoading = false;
              state.error = null;
            });
            return;
          }
          throw new Error('Failed to refresh auth');
        }

        const result = await response.json();

        set((state) => {
          state.user = result.user;
          state.isAuthenticated = true;
          state.isLoading = false;
          state.error = null;
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Auth refresh failed';
          state.isLoading = false;
          state.isAuthenticated = false;
          state.user = null;
        });
      }
    },

    setUser: (user: User | null) => {
      set((state) => {
        state.user = user;
        state.isAuthenticated = !!user;
      });
    },

    setLoading: (loading: boolean) => {
      set((state) => {
        state.isLoading = loading;
      });
    },

    setError: (error: string | null) => {
      set((state) => {
        state.error = error;
      });
    },

    clearError: () => {
      set((state) => {
        state.error = null;
      });
    },
  }))
);