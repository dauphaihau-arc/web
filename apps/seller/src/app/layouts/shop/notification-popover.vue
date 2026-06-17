<script setup lang="ts">
import NotificationPopover from '@arc/ui/shells/notification-popover/notification-popover.vue'
import { routes } from '~/shared/navigation/routes'
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query'
import { useMarkAllMyNotificationsAsRead, useMarkMyNotificationAsRead } from '~/shared/server-state/me/notifications/notifications.mutation'
import { useGetMyNotifications, useGetMyNotificationUnreadCount } from '~/shared/server-state/me/notifications/notifications.query'

type NotificationPopoverItem = {
  id: string
  title: string
  body: string
  data?: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}

const { data: currentUser } = useGetCurrentUser()
const notificationsQuery = useGetMyNotifications({ page: 1, limit: 8 })
const unreadCountQuery = useGetMyNotificationUnreadCount()
const { mutateAsync: markAsRead, isPending: isMarkingOne } = useMarkMyNotificationAsRead()
const { mutateAsync: markAllAsRead, isPending: isMarkingAll } = useMarkAllMyNotificationsAsRead()

const activeFilter = ref<'all' | 'unread'>('all')
const filters: Array<{ label: string, value: 'all' | 'unread' }> = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
]
const notifications = computed(() => {
  const results = notificationsQuery.data.value?.results ?? []

  if (activeFilter.value === 'unread') {
    return results.filter(notification => !notification.read_at)
  }

  return results
})
const unreadCount = computed(() => unreadCountQuery.data.value?.unread_count ?? 0)

function handleFilterChange(value: string) {
  if (value === 'all' || value === 'unread') {
    activeFilter.value = value
  }
}

function getNotificationTarget(notification: NotificationPopoverItem) {
  const target = typeof notification.data?.target === 'string'
    ? notification.data.target
    : null
  const orderIdentifier = typeof notification.data?.order_number === 'string'
    ? notification.data.order_number
    : typeof notification.data?.order_id === 'string'
      ? notification.data.order_id
      : null

  if (target === 'seller_order_detail' && orderIdentifier) {
    return routes.orderDetail(orderIdentifier)
  }

  return routes.orders()
}

async function handleNotificationClick(notification: NotificationPopoverItem, close: () => void) {
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
  navigateTo(routes.notifications())
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
    :filters="filters"
    :active-filter="activeFilter"
    :empty-text="activeFilter === 'unread' ? 'No unread notifications.' : 'No notifications yet.'"
    :show-unread-count="unreadCount > 0"
    view-all-label="View all"
    tooltip-text="Notifications"
    prevent-tooltip-when-open
    @filter-change="handleFilterChange"
    @mark-all="handleMarkAll"
    @item-click="handleNotificationClick"
    @view-all="handleViewAll"
  />
</template>
