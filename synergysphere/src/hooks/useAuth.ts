import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshAuth,
    setError,
    clearError,
  } = useAuthStore();

  // Auto-refresh auth on mount
  useEffect(() => {
    if (!isAuthenticated && !user) {
      refreshAuth();
    }
  }, [isAuthenticated, user, refreshAuth]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshAuth,
    setError,
    clearError,
  };
}