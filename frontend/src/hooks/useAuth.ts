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
        set({ token, loading: true, error: null });
        
        try {
          // Configure axios with the token
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Fetch user data
          await get().fetchUser();
        } catch (error) {
          if (error instanceof Error) {
            set({ error: error.message, loading: false });
          } else {
            set({ error: 'An unknown error occurred', loading: false });
          }
        }
      },
      
      logout: () => {
        // Remove token from axios headers
        delete axios.defaults.headers.common['Authorization'];
        
        // Clear auth state
        set({ user: null, token: null, loading: false, error: null });
      },
      
      fetchUser: async () => {
        set({ loading: true, error: null });
        
        try {
          const response = await axios.get('/api/auth/me');
          set({ user: response.data.user, loading: false });
        } catch (error) {
          if (error instanceof Error) {
            set({ error: error.message, loading: false });
          } else {
            set({ error: 'An unknown error occurred', loading: false });
          }
          
          // If unauthorized, clear token and user
          if (axios.isAxiosError(error) && error.response?.status === 401) {
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
