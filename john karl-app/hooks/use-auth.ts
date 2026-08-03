import { useAuthStore } from '@/store/auth-store';

/**
 * Hook to access the Authentication state easily.
 * Powered by Zustand store.
 */
export function useAuth() {
  return useAuthStore();
}

export default useAuth;
