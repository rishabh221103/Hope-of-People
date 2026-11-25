import { request } from './api';

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  referenceId: number | null;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export const notificationService = {
  getRecentNotifications: async (): Promise<NotificationItem[]> => {
    return request<NotificationItem[]>('/notifications');
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    return request<{ count: number }>('/notifications/unread-count');
  },

  markAsRead: async (id: number): Promise<NotificationItem> => {
    return request<NotificationItem>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  markAllAsRead: async (): Promise<void> => {
    return request<void>('/notifications/mark-all-read', {
      method: 'POST',
    });
  },

  deleteNotification: async (id: number): Promise<void> => {
    return request<void>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },
};
