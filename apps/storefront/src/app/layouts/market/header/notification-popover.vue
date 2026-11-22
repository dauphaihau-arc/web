<script setup lang="ts">
import NotificationPopover from '@arc/ui/shells/notification-popover/notification-popover.vue'
import { routes } from '~/shared/navigation/routes'
import type { NotificationItem } from '~/domains/me/api/notifications/contracts/notification.contract'
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query'
import { useMarkAllMyNotificationsAsRead, useMarkMyNotificationAsRead } from '~/domains/me/mutations/notifications/notifications.mutation'
import { useGetMyNotifications, useGetMyNotificationUnreadCount } from '~/domains/me/queries/notifications/notifications.query'
import { useLocalizedRoute } from '~/shared/composables/use-localized-route'

type NotificationPopoverClickItem = Pick<NotificationItem, 'id' | 'read_at'> & {
  data?: NotificationItem['data']
}

const { data: currentUser } = useGetCurrentUser()
const { localizePath } = useLocalizedRoute()
const notificationsQuery = useGetMyNotifications({ page: 1, limit: 8 })
const unreadCountQuery = useGetMyNotificationUnreadCount()
const { mutateAsync: markAsRead, isPending: isMarkingOne } = useMarkMyNotificationAsRead()
const { mutateAsync: markAllAsRead, isPending: isMarkingAll } = useMarkAllMyNotificationsAsRead()

const notifications = computed(() => notificationsQuery.data.value?.results ?? [])
const unreadCount = computed(() => unreadCountQuery.data.value?.unread_count ?? 0)

function getNotificationTarget(notification: NotificationPopoverClickItem) {
  const orderId = typeof notification.data?.order_id === 'string'
    ? notification.data.order_id
    : null

  if (orderId) {
    return localizePath(routes.orderDetail(orderId))
  }

  return localizePath(routes.orders())
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
    :empty-text="$t('header.notifications.empty')"
    :tooltip-text="$t('header.notifications.tooltip')"
    @mark-all="handleMarkAll"
    @item-click="handleNotificationClick"
  />
</template>
