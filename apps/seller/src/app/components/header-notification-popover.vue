<script setup lang="ts">
import NotificationPopoverPanel from '@arc/ui/notification-popover-panel.vue'
import { routes } from '~/shared/navigation/routes'
import type { NotificationItem } from '~/shared/api/me/notifications/contracts/notification.contract'
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query'
import { useMarkAllMyNotificationsAsRead, useMarkMyNotificationAsRead } from '~/shared/server-state/me/notifications/notifications.mutation'
import { useGetMyNotifications, useGetMyNotificationUnreadCount } from '~/shared/server-state/me/notifications/notifications.query'

const { data: currentUser } = useGetCurrentUser()
const notificationsQuery = useGetMyNotifications({ page: 1, limit: 8 })
const unreadCountQuery = useGetMyNotificationUnreadCount()
const { mutateAsync: markAsRead, isPending: isMarkingOne } = useMarkMyNotificationAsRead()
const { mutateAsync: markAllAsRead, isPending: isMarkingAll } = useMarkAllMyNotificationsAsRead()

const isPopoverOpen = ref(false)
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

function getNotificationTarget(notification: NotificationItem) {
  const target = typeof notification.data?.target === 'string'
    ? notification.data.target
    : null
  const orderId = typeof notification.data?.orderId === 'string'
    ? notification.data.orderId
    : null

  if (target === 'seller_order_detail' && orderId) {
    return routes.orderDetail(orderId)
  }

  return routes.orders()
}

async function handleNotificationClick(notification: NotificationItem, close: () => void) {
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
  <UPopover
    v-if="currentUser?.user"
    v-model:open="isPopoverOpen"
    :popper="{ placement: 'bottom-end' }"
  >
    <UChip
      :text="unreadCount"
      :show="unreadCount > 0"
      size="md"
      position="bottom-right"
      :ui="{ position: { 'bottom-right': 'translate-y-[-4px] translate-x-[-4px]' } }"
    >
      <UTooltip
        text="Notifications"
        :prevent="isPopoverOpen"
      >
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
        :filters="filters"
        :active-filter="activeFilter"
        :empty-text="activeFilter === 'unread' ? 'No unread notifications.' : 'No notifications yet.'"
        :show-unread-count="unreadCount > 0"
        view-all-label="View all"
        @filter-change="handleFilterChange"
        @mark-all="handleMarkAll(close)"
        @item-click="handleNotificationClick($event, close)"
        @view-all="handleViewAll(close)"
      />
    </template>
  </UPopover>
</template>
