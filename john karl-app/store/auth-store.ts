import { AuthState, User } from '@/types/auth';
import { SecureStorageService } from '@/utils/storage';
import { create } from 'zustand';

export interface AuthStore extends AuthState {
  familyMembers: any[];
  fetchFamilyMembers: () => Promise<void>;
  signIn: (token: string, refreshToken: string | null, userData: User) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  initialize: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (formData: FormData) => Promise<{ success: boolean; message?: string }>;
  isProfilePictureLoading: boolean;
  setProfilePictureLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  isAuthenticated: false,
  user: null,
  token: null,
  refreshToken: null,
  isLoading: true,
  isProfilePictureLoading: false,
  familyMembers: [],

  setProfilePictureLoading: (isLoading: boolean) => set({ isProfilePictureLoading: isLoading }),

  fetchFamilyMembers: async () => {
    try {
      const { api } = require('@/services/api');
      const response = await api.get('/users/family-members');
      if (response.success) {
        const rawMembers = response.data?.data || response.data || [];
        if (Array.isArray(rawMembers)) {
          const members = rawMembers.map((m: any) => {
            const existingCount = m.memories ?? m.memoriesCount ?? m.memoryCount ?? m._count?.memories ?? m.totalMemories ?? m.memories_count;
            return {
              ...m,
              memories: existingCount !== undefined ? Number(existingCount) : (m.memories !== undefined ? m.memories : 1)
            };
          });
          set({ familyMembers: members });
        } else {
          set({ familyMembers: [] });
        }
      }
    } catch (error) {
      console.error('[AuthStore] Failed to fetch family members:', error);
    }
  },

  initialize: async () => {
    try {
      const storedToken = await SecureStorageService.getItem('authToken');
      const storedRefreshToken = await SecureStorageService.getItem('refreshToken');
      const storedUser = await SecureStorageService.getItem('authUser');

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser) as User;
        set({
          isAuthenticated: true,
          user: parsedUser,
          token: storedToken,
          refreshToken: storedRefreshToken,
          isLoading: false,
        });

        // Silently fetch and sync fresh profile data from /auth/me in background
        get().fetchProfile().catch((err) => console.error('Silent profile sync failed:', err));
        get().fetchFamilyMembers().catch((err) => console.error('Silent family members sync failed:', err));
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Auth store initialization error:', error);
      set({ isLoading: false });
    }
  },

  fetchProfile: async () => {
    try {
      const { api } = require('@/services/api');
      const response = await api.get('/users/profile');
      console.log('[AuthStore fetchProfile] API Response success:', response.success);
      if (response.success && response.data) {
        console.log('[AuthStore fetchProfile] Raw API data:', JSON.stringify(response.data, null, 2));
        const userData = response.data.data?.user
            || response.data.user
            || (response.data?.id ? response.data : null)
            || (response.data?.data?.id ? response.data.data : null); // actual shape: { success, data: { id, name, ... } }
        if (userData) {
          const nameParts = (userData.name || '').trim().split(/\s+/);
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          const mappedUser = {
            ...userData,
            firstName,
            lastName,
          };
          set({ user: mappedUser });
          await SecureStorageService.setItem('authUser', JSON.stringify(mappedUser));
          console.log('[AuthStore fetchProfile] Synced user to store successfully.');
        } else {
          console.warn('[AuthStore fetchProfile] No user data found in response.data:', response.data);
        }
      } else {
        console.error('[AuthStore fetchProfile] API request unsuccessful or returned no data. Response:', response);
      }
    } catch (error) {
      console.error('Failed to sync user profile from /users/profile:', error);
    }
  },

  signIn: async (token: string, refreshToken: string | null, userData: User) => {
    try {
      await SecureStorageService.setItem('authToken', token);
      if (refreshToken) {
        await SecureStorageService.setItem('refreshToken', refreshToken);
      } else {
        await SecureStorageService.removeItem('refreshToken');
      }
      await SecureStorageService.setItem('authUser', JSON.stringify(userData));

      set({
        isAuthenticated: true,
        user: userData,
        token,
        refreshToken,
        isLoading: false,
        familyMembers: [],
      });
    } catch (error) {
      console.error('Sign-in persistence failed:', error);
      throw error;
    }
  },

  signOut: async () => {
    const { token } = get();
    if (token) {
      try {
        console.log('[AuthStore] Inactivating tokens by calling backend /auth/logout...');
        const { api } = require('@/services/api');
        await api.post('/auth/logout');
      } catch (apiErr) {
        console.warn('[AuthStore] Backend logout request failed:', apiErr);
      }
    }

    try {
      await SecureStorageService.removeItem('authToken');
      await SecureStorageService.removeItem('refreshToken');
      await SecureStorageService.removeItem('authUser');

      set({
        isAuthenticated: false,
        user: null,
        token: null,
        refreshToken: null,
        isLoading: false,
        familyMembers: [],
      });
      console.log('[AuthStore] Locally cleared auth credentials.');
    } catch (error) {
      console.error('Sign-out failed:', error);
    }
  },

  updateUser: async (updates: Partial<User>) => {
    const { user } = get();
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    set({ user: updatedUser });

    try {
      await SecureStorageService.setItem('authUser', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Failed to persist updated user info:', error);
    }
  },

  updateProfile: async (formData: FormData) => {
    try {
      const { api } = require('@/services/api');
      const response = await api.patch('/users/profile', formData);
      console.log('[AuthStore updateProfile] Response success:', response.success);
      if (response.success && response.data) {
        console.log('[AuthStore updateProfile] Response data:', JSON.stringify(response.data, null, 2));
        const userData = response.data.data?.user
            || response.data.user
            || (response.data?.id ? response.data : null)
            || (response.data?.data?.id ? response.data.data : null); // actual shape: { success, data: { id, name, ... } }
        if (userData) {
          const nameParts = (userData.name || '').trim().split(/\s+/);
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          const mappedUser = {
            ...userData,
            firstName,
            lastName,
          };
          set({ user: mappedUser });
          await SecureStorageService.setItem('authUser', JSON.stringify(mappedUser));
          console.log('[AuthStore updateProfile] Synced updated user to store.');
          return { success: true };
        }
      }
      return { success: false, message: response.message || 'Failed to update profile' };
    } catch (error: any) {
      console.error('[AuthStore updateProfile] Error:', error);
      return { success: false, message: error?.message || 'An error occurred during update' };
    }
  },
}));
