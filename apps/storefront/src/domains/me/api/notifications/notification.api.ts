import type {
  ListNotificationsRequest,
  ListNotificationsResponse,
  ReadAllNotificationsResponse,
  ReadNotificationResponse,
  RegisterWebPushSubscriptionRequest,
  RegisterWebPushSubscriptionResponse,
  UnreadCountResponse,
  UnregisterWebPushSubscriptionRequest,
  UnregisterWebPushSubscriptionResponse,
  WebPushPublicKeyResponse
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

  getWebPushPublicKey() {
    return apiClient.get<WebPushPublicKeyResponse>(
      '/me/notifications/web-push/public-key'
    );
  },

  registerWebPushSubscription(payload: RegisterWebPushSubscriptionRequest) {
    return apiClient.post<RegisterWebPushSubscriptionResponse>(
      '/me/notifications/web-push/subscriptions',
      payload
    );
  },

  unregisterWebPushSubscription(payload: UnregisterWebPushSubscriptionRequest) {
    return apiClient.delete<UnregisterWebPushSubscriptionResponse>(
      '/me/notifications/web-push/subscriptions',
      undefined,
      payload
    );
  },
};
