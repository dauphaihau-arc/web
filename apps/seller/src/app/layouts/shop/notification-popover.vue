<script setup lang="ts">
import NotificationPopover from '@arc/ui/shells/notification-popover/notification-popover.vue'
import { routes } from '~/shared/navigation/routes'
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query'
import { useMarkAllMyNotificationsAsRead, useMarkMyNotificationAsRead } from '~/domains/me/mutations/notifications.mutation'
import { useGetMyNotifications, useGetMyNotificationUnreadCount } from '~/domains/me/queries/notifications.query'
import { shopOrderApi } from '~/domains/shop/api/order/order.api'
import { resolveMyShopId } from '~/domains/shop/utils/resolve-my-shop-id'
import { createOrderExportEventsClient } from '~/domains/shop/order/order-export-events.client'

type NotificationPopoverItem = {
  id: string
  title: string
  body: string
  data?: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}

const { data: currentUser } = useGetCurrentUser()
const queryClient = useQueryClient()
const notificationsQuery = useGetMyNotifications({ page: 1, limit: 8 })
const unreadCountQuery = useGetMyNotificationUnreadCount()
const { mutateAsync: markAsRead, isPending: isMarkingOne } = useMarkMyNotificationAsRead()
const { mutateAsync: markAllAsRead, isPending: isMarkingAll } = useMarkAllMyNotificationsAsRead()
const orderExportEventsClient = shallowRef<ReturnType<typeof createOrderExportEventsClient> | null>(null)

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

  if (target === 'order_export_download') {
    return null
  }

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

  if (notification.data?.target === 'order_export_download') {
    await downloadOrderExportNotification(notification)
    close()
    return
  }

  const target = getNotificationTarget(notification)

  close()
  await navigateTo(target ?? routes.orders())
}

async function handleMarkAll(close: () => void) {
  await markAllAsRead()
  close()
}

function handleViewAll(close: () => void) {
  close()
  navigateTo(routes.notifications())
}

async function downloadOrderExportNotification(notification: NotificationPopoverItem) {
  const exportId = typeof notification.data?.export_id === 'string'
    ? notification.data.export_id
    : null
  const filename = typeof notification.data?.filename === 'string'
    ? notification.data.filename
    : 'orders.csv'

  if (!exportId) {
    return
  }

  const shopId = typeof notification.data?.shop_id === 'string'
    ? notification.data.shop_id
    : await resolveMyShopId(queryClient)
  const blob = await shopOrderApi.downloadExport(shopId, exportId)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  orderExportEventsClient.value = createOrderExportEventsClient((payload) => {
    if (
      payload.eventType === 'order_export.completed'
      || payload.eventType === 'order_export.failed'
    ) {
      void queryClient.invalidateQueries({ queryKey: ['my-notifications'] })
      void queryClient.invalidateQueries({ queryKey: ['my-notifications-unread-count'] })
    }
  })
})

onBeforeUnmount(() => {
  orderExportEventsClient.value?.close()
})
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
