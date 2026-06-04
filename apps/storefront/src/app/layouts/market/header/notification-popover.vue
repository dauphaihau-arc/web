<script setup lang="ts">
import NotificationPopoverPanel from '@arc/ui/notification-popover-panel.vue'
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
  <UPopover
    v-if="currentUser?.user"
    :popper="{ placement: 'bottom-end' }"
  >
    <UChip
      :text="unreadCount"
      :show="unreadCount > 0"
      size="md"
      position="bottom-right"
      :ui="{ position: { 'bottom-right': 'translate-y-[-4px] translate-x-[-4px]' } }"
    >
      <UTooltip text="Notifications">
        <UButton
          color="gray"
          variant="ghost"
          class="icon-button"
        >
          <AppIcon name="bell" />
        </UButton>
      </UTooltip>
    </UChip>

    <template #panel="{ close }">
      <NotificationPopoverPanel
        :notifications="notifications"
        :unread-count="unreadCount"
        :loading="notificationsQuery.isLoading.value"
        :error="notificationsQuery.isError.value"
        :is-marking-all="isMarkingAll"
        :is-marking-one="isMarkingOne"
        empty-text="No notifications yet."
        view-all-label="View all"
        @mark-all="handleMarkAll(close)"
        @item-click="handleNotificationClick($event, close)"
        @view-all="handleViewAll(close)"
      />
    </template>
  </UPopover>
</template>
