import type {
  ListNotificationsRequest,
  ListNotificationsResponse,
  UnreadCountResponse,
} from '~/shared/api/me/notifications/contracts/notification.contract'
import { meNotificationApi } from '~/shared/api/me/notifications/notification.api'

export function useGetMyNotifications(queryParams?: MaybeRefOrGetter<ListNotificationsRequest | undefined>) {
  return useQuery<ListNotificationsResponse>({
    queryKey: computed(() => ['my-notifications', toValue(queryParams)]),
    queryFn: () => meNotificationApi.list(toValue(queryParams)),
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })
}

export function useGetMyNotificationUnreadCount() {
  return useQuery<UnreadCountResponse>({
    queryKey: ['my-notifications-unread-count'],
    queryFn: () => meNotificationApi.getUnreadCount(),
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })
}
