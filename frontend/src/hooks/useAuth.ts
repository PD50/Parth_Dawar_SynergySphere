import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// Define the User type
interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

// Define the Auth State
interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

// Create the auth store
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,
      
      login: async (token) => {
        console.log('[AUTH] Starting login process with token');
        set({ token, loading: true, error: null });
        
        try {
          // Configure axios with the token
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Fetch user data
          console.log('[AUTH] Fetching user data');
          await get().fetchUser();
          console.log('[AUTH] Login successful, user data fetched');
        } catch (error) {
          console.error('[AUTH] Login error:', error);
          if (error instanceof Error) {
            set({ error: error.message, loading: false });
          } else {
            set({ error: 'An unknown error occurred', loading: false });
          }
        }
      },
      
      logout: () => {
        console.log('[AUTH] Logging out');
        // Remove token from axios headers
        delete axios.defaults.headers.common['Authorization'];
        
        // Clear auth state
        set({ user: null, token: null, loading: false, error: null });
        console.log('[AUTH] Logout complete, state cleared');
      },
      
      fetchUser: async () => {
        console.log('[AUTH] Starting fetchUser');
        set({ loading: true, error: null });

        try {
          // Check if this is a mock token for testing
          const currentToken = get().token;
          if (currentToken === 'mock-jwt-token-for-testing') {
            console.log('[AUTH] Using mock user data for testing');
            const mockUser = {
              id: 'test-user-id',
              name: 'Test User',
              email: 'test@example.com',
              avatar: 'https://via.placeholder.com/150',
              role: 'user'
            };
            set({ user: mockUser, loading: false });
            return;
          }

          console.log('[AUTH] Making API request to /api/auth/me');
          const response = await axios.get('/api/auth/me');
          console.log('[AUTH] User data received:', response.data);
          set({ user: response.data.user, loading: false });
        } catch (error) {
          console.error('[AUTH] Error fetching user:', error);
          if (error instanceof Error) {
            set({ error: error.message, loading: false });
          } else {
            set({ error: 'An unknown error occurred', loading: false });
          }

          // If unauthorized, clear token and user
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            console.log('[AUTH] 401 Unauthorized, clearing auth state');
            get().logout();
          }
        }
      },
    }),
    {
      name: 'motion-gpt-auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
);

// Create a hook for convenient use in components
export const useAuth = () => {
  const { user, token, loading, error, login, logout, fetchUser } = useAuthStore();
  
  return {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token,
    login,
    logout,
    fetchUser,
  };
};
