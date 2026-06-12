import type {
  ListNotificationsRequest,
  ListNotificationsResponse,
  ReadAllNotificationsResponse,
  ReadNotificationResponse,
  UnreadCountResponse
} from './contracts/notification.contract';
import { apiClient } from '~/shared/lib/api-client';

export const meNotificationApi = {
  list(params?: ListNotificationsRequest) {
    return apiClient.get<ListNotificationsResponse>(
      '/me/notifications',
      params
    );
  },

  getUnreadCount() {
    return apiClient.get<UnreadCountResponse>(
      '/me/notifications/unread-count'
    );
  },

  markAsRead(notificationId: string) {
    return apiClient.patch<ReadNotificationResponse>(
      `/me/notifications/${notificationId}/read`
    );
  },

  markAllAsRead() {
    return apiClient.patch<ReadAllNotificationsResponse>(
      '/me/notifications/read-all'
    );
  },
};
