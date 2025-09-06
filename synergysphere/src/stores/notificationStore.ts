import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { subscribeWithSelector } from "zustand/middleware";
import { 
  Notification, 
  NotificationState, 
  NotificationFilters, 
  NotificationSettings,
  NotificationType,
  CreateNotificationRequest
} from "@/types/notifications";

interface NotificationStore extends NotificationState {
  // Notification Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  updateNotification: (notificationId: string, updates: Partial<Notification>) => void;
  removeNotification: (notificationId: string) => void;
  
  // Read/Unread Actions
  markAsRead: (notificationId: string) => void;
  markAsUnread: (notificationId: string) => void;
  markAllAsRead: (projectId?: string) => void;
  setUnreadCount: (count: number) => void;
  getUnreadNotifications: () => Notification[];
  
  // Filter Actions
  getFilteredNotifications: (filters?: NotificationFilters) => Notification[];
  getNotificationsByType: (type: NotificationType) => Notification[];
  getNotificationsByProject: (projectId: string) => Notification[];
  
  // Settings Actions
  setSettings: (settings: NotificationSettings) => void;
  updateSettings: (updates: Partial<NotificationSettings>) => void;
  
  // Loading and Error States
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastFetchedAt: (timestamp?: Date) => void;
  
  // Real-time Updates
  handleRealTimeNotification: (notification: Notification) => void;
  handleRealTimeNotificationUpdate: (notification: Notification) => void;
  handleRealTimeNotificationDelete: (notificationId: string) => void;
  
  // Utility Actions
  getNotificationById: (notificationId: string) => Notification | undefined;
  getRecentNotifications: (hours?: number) => Notification[];
  groupNotificationsByDate: () => Record<string, Notification[]>;
  
  // Pagination
  hasMoreNotifications: boolean;
  lastNotificationId?: string;
  setHasMoreNotifications: (hasMore: boolean) => void;
  setLastNotificationId: (notificationId: string | undefined) => void;
  
  // Bulk Actions
  markMultipleAsRead: (notificationIds: string[]) => void;
  deleteMultiple: (notificationIds: string[]) => void;
  
  // Analytics
  getNotificationStats: () => {
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
    byProject: Record<string, number>;
  };
}

const filterNotifications = (notifications: Notification[], filters: NotificationFilters = {}): Notification[] => {
  return notifications.filter((notification) => {
    // Type filter
    if (filters.type && notification.type !== filters.type) {
      return false;
    }

    // Project filter
    if (filters.projectId && notification.projectId !== filters.projectId) {
      return false;
    }

    // Read status filter
    if (filters.isRead !== undefined && notification.isRead !== filters.isRead) {
      return false;
    }

    // Date range filters
    if (filters.fromDate && new Date(notification.createdAt) < new Date(filters.fromDate)) {
      return false;
    }

    if (filters.toDate && new Date(notification.createdAt) > new Date(filters.toDate)) {
      return false;
    }

    return true;
  });
};

const groupNotificationsByDate = (notifications: Notification[]): Record<string, Notification[]> => {
  const groups: Record<string, Notification[]> = {};
  
  notifications.forEach(notification => {
    const date = new Date(notification.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
  });
  
  // Sort notifications within each group by newest first
  Object.keys(groups).forEach(date => {
    groups[date].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });
  
  return groups;
};

export const useNotificationStore = create<NotificationStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      settings: null,
      lastFetchedAt: undefined,
      hasMoreNotifications: true,
      lastNotificationId: undefined,

      // Notification Actions
      setNotifications: (notifications) =>
        set((state) => {
          state.notifications = notifications.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          state.unreadCount = notifications.filter(n => !n.isRead).length;
        }),

      addNotification: (notification) =>
        set((state) => {
          // Check if notification already exists
          const existingIndex = state.notifications.findIndex(n => n.id === notification.id);
          if (existingIndex === -1) {
            state.notifications.unshift(notification);
            if (!notification.isRead) {
              state.unreadCount += 1;
            }
          }
        }),

      updateNotification: (notificationId, updates) =>
        set((state) => {
          const notificationIndex = state.notifications.findIndex(n => n.id === notificationId);
          if (notificationIndex !== -1) {
            const oldNotification = state.notifications[notificationIndex];
            const wasRead = oldNotification.isRead;
            
            Object.assign(state.notifications[notificationIndex], updates);
            
            // Update unread count if read status changed
            const isNowRead = state.notifications[notificationIndex].isRead;
            if (!wasRead && isNowRead) {
              state.unreadCount = Math.max(0, state.unreadCount - 1);
            } else if (wasRead && !isNowRead) {
              state.unreadCount += 1;
            }
          }
        }),

      removeNotification: (notificationId) =>
        set((state) => {
          const notificationIndex = state.notifications.findIndex(n => n.id === notificationId);
          if (notificationIndex !== -1) {
            const notification = state.notifications[notificationIndex];
            if (!notification.isRead) {
              state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
            state.notifications.splice(notificationIndex, 1);
          }
        }),

      // Read/Unread Actions
      markAsRead: (notificationId) =>
        set((state) => {
          const notification = state.notifications.find(n => n.id === notificationId);
          if (notification && !notification.isRead) {
            notification.isRead = true;
            notification.readAt = new Date();
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }),

      markAsUnread: (notificationId) =>
        set((state) => {
          const notification = state.notifications.find(n => n.id === notificationId);
          if (notification && notification.isRead) {
            notification.isRead = false;
            notification.readAt = undefined;
            state.unreadCount += 1;
          }
        }),

      markAllAsRead: (projectId) =>
        set((state) => {
          state.notifications.forEach(notification => {
            if (!notification.isRead && (!projectId || notification.projectId === projectId)) {
              notification.isRead = true;
              notification.readAt = new Date();
            }
          });
          
          if (projectId) {
            state.unreadCount = state.notifications.filter(n => 
              !n.isRead && n.projectId !== projectId
            ).length;
          } else {
            state.unreadCount = 0;
          }
        }),

      setUnreadCount: (count) =>
        set((state) => {
          state.unreadCount = count;
        }),

      getUnreadNotifications: () => {
        const { notifications } = get();
        return notifications.filter(n => !n.isRead);
      },

      // Filter Actions
      getFilteredNotifications: (filters) => {
        const { notifications } = get();
        return filterNotifications(notifications, filters);
      },

      getNotificationsByType: (type) => {
        const { notifications } = get();
        return notifications.filter(n => n.type === type);
      },

      getNotificationsByProject: (projectId) => {
        const { notifications } = get();
        return notifications.filter(n => n.projectId === projectId);
      },

      // Settings Actions
      setSettings: (settings) =>
        set((state) => {
          state.settings = settings;
        }),

      updateSettings: (updates) =>
        set((state) => {
          if (state.settings) {
            Object.assign(state.settings, updates);
          }
        }),

      // Loading and Error States
      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      setLastFetchedAt: (timestamp) =>
        set((state) => {
          state.lastFetchedAt = timestamp;
        }),

      // Real-time Updates
      handleRealTimeNotification: (notification) =>
        set((state) => {
          get().addNotification(notification);
        }),

      handleRealTimeNotificationUpdate: (notification) =>
        set((state) => {
          const existingIndex = state.notifications.findIndex(n => n.id === notification.id);
          if (existingIndex !== -1) {
            state.notifications[existingIndex] = notification;
          }
        }),

      handleRealTimeNotificationDelete: (notificationId) =>
        set((state) => {
          get().removeNotification(notificationId);
        }),

      // Utility Actions
      getNotificationById: (notificationId) => {
        const { notifications } = get();
        return notifications.find(n => n.id === notificationId);
      },

      getRecentNotifications: (hours = 24) => {
        const { notifications } = get();
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        return notifications.filter(n => new Date(n.createdAt) >= cutoff);
      },

      groupNotificationsByDate: () => {
        const { notifications } = get();
        return groupNotificationsByDate(notifications);
      },

      // Pagination
      setHasMoreNotifications: (hasMore) =>
        set((state) => {
          state.hasMoreNotifications = hasMore;
        }),

      setLastNotificationId: (notificationId) =>
        set((state) => {
          state.lastNotificationId = notificationId;
        }),

      // Bulk Actions
      markMultipleAsRead: (notificationIds) =>
        set((state) => {
          let updatedCount = 0;
          notificationIds.forEach(id => {
            const notification = state.notifications.find(n => n.id === id);
            if (notification && !notification.isRead) {
              notification.isRead = true;
              notification.readAt = new Date();
              updatedCount++;
            }
          });
          state.unreadCount = Math.max(0, state.unreadCount - updatedCount);
        }),

      deleteMultiple: (notificationIds) =>
        set((state) => {
          let unreadDeleted = 0;
          notificationIds.forEach(id => {
            const index = state.notifications.findIndex(n => n.id === id);
            if (index !== -1) {
              if (!state.notifications[index].isRead) {
                unreadDeleted++;
              }
              state.notifications.splice(index, 1);
            }
          });
          state.unreadCount = Math.max(0, state.unreadCount - unreadDeleted);
        }),

      // Analytics
      getNotificationStats: () => {
        const { notifications } = get();
        const stats = {
          total: notifications.length,
          unread: notifications.filter(n => !n.isRead).length,
          byType: {} as Record<NotificationType, number>,
          byProject: {} as Record<string, number>
        };

        // Count by type
        notifications.forEach(n => {
          stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
          if (n.projectId) {
            stats.byProject[n.projectId] = (stats.byProject[n.projectId] || 0) + 1;
          }
        });

        return stats;
      },
    }))
  )
);