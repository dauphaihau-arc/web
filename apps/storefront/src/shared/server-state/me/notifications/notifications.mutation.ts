import { meNotificationApi } from '~/shared/api/me/notifications/notification.api'
import type { ListNotificationsResponse, NotificationItem, UnreadCountResponse } from '~/shared/api/me/notifications/contracts/notification.contract'

function markNotificationAsRead(notification: NotificationItem): NotificationItem {
  if (notification.read_at) {
    return notification
  }

  return {
    ...notification,
    read_at: new Date().toISOString(),
  }
}

export function useMarkMyNotificationAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['mark-my-notification-as-read'],
    mutationFn: async (notificationId: string) => meNotificationApi.markAsRead(notificationId),
    onMutate(notificationId) {
      const queryEntries = queryClient.getQueriesData<ListNotificationsResponse>({
        queryKey: ['my-notifications'],
      })
      const unreadCount = queryClient.getQueryData<UnreadCountResponse>(['my-notifications-unread-count'])
      let decremented = false

      for (const [queryKey, data] of queryEntries) {
        if (!data) {
          continue
        }

        const nextResults = data.results.map((notification) => {
          if (notification.id !== notificationId) {
            return notification
          }

          if (!notification.read_at) {
            decremented = true
          }

          return markNotificationAsRead(notification)
        })

        queryClient.setQueryData<ListNotificationsResponse>(queryKey, {
          ...data,
          results: nextResults,
        })
      }

      if (unreadCount && decremented) {
        queryClient.setQueryData<UnreadCountResponse>(['my-notifications-unread-count'], {
          unread_count: Math.max(0, unreadCount.unread_count - 1),
        })
      }

      return { queryEntries, unreadCount }
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['my-notifications-unread-count'] })
    },
    onError(_error, _notificationId, context) {
      if (!context) {
        return
      }

      for (const [queryKey, data] of context.queryEntries) {
        queryClient.setQueryData(queryKey, data)
      }

      if (context.unreadCount) {
        queryClient.setQueryData(['my-notifications-unread-count'], context.unreadCount)
      }
    },
  })
}

export function useMarkAllMyNotificationsAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['mark-all-my-notifications-as-read'],
    mutationFn: async () => meNotificationApi.markAllAsRead(),
    onMutate() {
      const queryEntries = queryClient.getQueriesData<ListNotificationsResponse>({
        queryKey: ['my-notifications'],
      })
      const unreadCount = queryClient.getQueryData<UnreadCountResponse>(['my-notifications-unread-count'])

      for (const [queryKey, data] of queryEntries) {
        if (!data) {
          continue
        }

        queryClient.setQueryData<ListNotificationsResponse>(queryKey, {
          ...data,
          results: data.results.map(markNotificationAsRead),
        })
      }

      if (unreadCount) {
        queryClient.setQueryData<UnreadCountResponse>(['my-notifications-unread-count'], {
          unread_count: 0,
        })
      }

      return { queryEntries, unreadCount }
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['my-notifications-unread-count'] })
    },
    onError(_error, _variables, context) {
      if (!context) {
        return
      }

      for (const [queryKey, data] of context.queryEntries) {
        queryClient.setQueryData(queryKey, data)
      }

      if (context.unreadCount) {
        queryClient.setQueryData(['my-notifications-unread-count'], context.unreadCount)
      }
    },
  })
}
