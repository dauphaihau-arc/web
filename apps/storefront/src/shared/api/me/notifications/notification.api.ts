import type {
  RegisterWebPushSubscriptionRequest,
  RegisterWebPushSubscriptionResponse,
  UnregisterWebPushSubscriptionRequest,
  UnregisterWebPushSubscriptionResponse,
  WebPushPublicKeyResponse,
} from './contracts/notification.contract'
import { apiClient } from '~/shared/lib/api-client'

export const meNotificationApi = {
  getWebPushPublicKey() {
    return apiClient.get<WebPushPublicKeyResponse>(
      '/me/notifications/web-push/public-key',
    )
  },

  registerWebPushSubscription(payload: RegisterWebPushSubscriptionRequest) {
    return apiClient.post<RegisterWebPushSubscriptionResponse>(
      '/me/notifications/web-push/subscriptions',
      payload,
    )
  },

  unregisterWebPushSubscription(payload: UnregisterWebPushSubscriptionRequest) {
    return apiClient.delete<UnregisterWebPushSubscriptionResponse>(
      '/me/notifications/web-push/subscriptions',
      undefined,
      payload,
    )
  },
}
