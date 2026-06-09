<script setup lang="ts">
import NotificationPopover from '@arc/ui/notification-popover/notification-popover.vue'
import { routes } from '~/shared/navigation/routes'
import type { NotificationItem } from '~/shared/api/me/notifications/contracts/notification.contract'
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query'
import { useMarkAllMyNotificationsAsRead, useMarkMyNotificationAsRead } from '~/shared/server-state/me/notifications/notifications.mutation'
import { useGetMyNotifications, useGetMyNotificationUnreadCount } from '~/shared/server-state/me/notifications/notifications.query'

type NotificationPopoverClickItem = Pick<NotificationItem, 'id' | 'read_at'> & {
  data?: NotificationItem['data']
}

const { data: currentUser } = useGetCurrentUser()
const notificationsQuery = useGetMyNotifications({ page: 1, limit: 8 })
const unreadCountQuery = useGetMyNotificationUnreadCount()
const { mutateAsync: markAsRead, isPending: isMarkingOne } = useMarkMyNotificationAsRead()
const { mutateAsync: markAllAsRead, isPending: isMarkingAll } = useMarkAllMyNotificationsAsRead()

const notifications = computed(() => notificationsQuery.data.value?.results ?? [])
const unreadCount = computed(() => unreadCountQuery.data.value?.unread_count ?? 0)

function getNotificationTarget(notification: NotificationPopoverClickItem) {
  const orderId = typeof notification.data?.orderId === 'string'
    ? notification.data.orderId
    : null

  if (orderId) {
    return routes.orderDetail(orderId)
  }

  return routes.orders()
}

async function handleNotificationClick(notification: NotificationPopoverClickItem, close: () => void) {
  if (!notification.read_at) {
    await markAsRead(notification.id)
  }

  close()
  await navigateTo(getNotificationTarget(notification))
}

async function handleMarkAll(close: () => void) {
  await markAllAsRead()
  close()
}

function handleViewAll(close: () => void) {
  close()
  navigateTo(routes.accountNotifications())
}
</script>

<template>
  <NotificationPopover
    v-if="currentUser?.user"
    :notifications="notifications"
    :unread-count="unreadCount"
    :loading="notificationsQuery.isLoading.value"
    :error="notificationsQuery.isError.value"
    :is-marking-all="isMarkingAll"
    :is-marking-one="isMarkingOne"
    empty-text="No notifications yet."
    view-all-label="View all"
    tooltip-text="Notifications"
    @mark-all="handleMarkAll"
    @item-click="handleNotificationClick"
    @view-all="handleViewAll"
  />
</template>
