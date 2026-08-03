import { create } from 'zustand';

export interface Notification {
  id: string;
  actorId: string;
  type: 
    | 'family_invitation_received'
    | 'family_invitation_accepted'
    | 'trusted_contact_invitation_received'
    | 'trusted_contact_invitation_accepted'
    | 'legacy_access_request_created'
    | 'legacy_access_request_approved'
    | 'legacy_access_request_rejected'
    | 'memory_shared'
    | 'admin_broadcast'
    | 'system';
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  readAt?: string;
  priority: 'low' | 'normal' | 'high';
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isActioning: boolean;
  error: string | null;
  fetchNotifications: (params?: { page?: number; limit?: number; isRead?: boolean; type?: string; priority?: string }) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isActioning: false,
  error: null,

  fetchNotifications: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { api } = require('@/services/api');
      
      // Build query string
      const queryParts: string[] = [];
      if (params.page !== undefined) queryParts.push(`page=${params.page}`);
      if (params.limit !== undefined) queryParts.push(`limit=${params.limit}`);
      if (params.isRead !== undefined) queryParts.push(`isRead=${params.isRead}`);
      if (params.type !== undefined) queryParts.push(`type=${params.type}`);
      if (params.priority !== undefined) queryParts.push(`priority=${params.priority}`);
      
      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      console.log(`[NotificationStore] Fetching /notifications${queryString}...`);
      
      const response = await api.get(`/notifications${queryString}`);
      if (response.success) {
        const list = response.data?.data || response.data || [];
        set({ notifications: Array.isArray(list) ? list : [] });
      } else {
        set({ error: response.message || 'Failed to retrieve notifications.' });
      }
    } catch (err: any) {
      console.error('[NotificationStore] Fetch error:', err);
      set({ error: err?.message || 'A network error occurred.' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const { api } = require('@/services/api');
      console.log('[NotificationStore] Fetching /notifications/unread-count...');
      const response = await api.get('/notifications/unread-count');
      if (response.success) {
        const count = response.data?.count ?? response.data?.unreadCount ?? 0;
        set({ unreadCount: count });
      }
    } catch (error) {
      console.error('[NotificationStore] Failed to fetch unread count:', error);
    }
  },

  markAllRead: async () => {
    set({ isActioning: true });
    try {
      const { api } = require('@/services/api');
      console.log('[NotificationStore] Marking all read...');
      const response = await api.patch('/notifications/read-all');
      if (response.success) {
        // Optimistically set all local notifications to read
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        }));
      }
    } catch (error) {
      console.error('[NotificationStore] Failed to mark all read:', error);
    } finally {
      set({ isActioning: false });
    }
  },

  markRead: async (notificationId: string) => {
    try {
      const { api } = require('@/services/api');
      console.log(`[NotificationStore] Marking read notification: ${notificationId}...`);
      const response = await api.patch(`/notifications/${notificationId}/read`);
      if (response.success) {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      }
    } catch (error) {
      console.error('[NotificationStore] Failed to mark single read:', error);
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      const { api } = require('@/services/api');
      console.log(`[NotificationStore] Deleting notification: ${notificationId}...`);
      const response = await api.delete(`/notifications/${notificationId}`);
      if (response.success) {
        set((state) => {
          const targeted = state.notifications.find((n) => n.id === notificationId);
          const wasUnread = targeted ? !targeted.isRead : false;
          return {
            notifications: state.notifications.filter((n) => n.id !== notificationId),
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          };
        });
      }
    } catch (error) {
      console.error('[NotificationStore] Failed to delete notification:', error);
    }
  },
}));
