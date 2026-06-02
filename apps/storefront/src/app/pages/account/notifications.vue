<script setup lang="ts">
import dayjs from 'dayjs'
import { routes } from '~/shared/navigation/routes'
import type { NotificationItem } from '~/shared/api/me/notifications/contracts/notification.contract'
import { useMarkAllMyNotificationsAsRead, useMarkMyNotificationAsRead } from '~/shared/server-state/me/notifications/notifications.mutation'
import { useGetMyNotifications, useGetMyNotificationUnreadCount } from '~/shared/server-state/me/notifications/notifications.query'

definePageMeta({ layout: 'market', middleware: ['auth'] })

const page = ref(1)
const limit = 20
const activeFilter = ref<'all' | 'unread'>('all')

const filters: Array<{ label: string, value: 'all' | 'unread' }> = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
]

const queryParams = computed(() => ({
  page: page.value,
  limit,
}))

const notificationsQuery = useGetMyNotifications(queryParams)
const unreadCountQuery = useGetMyNotificationUnreadCount()
const { mutateAsync: markAsRead, isPending: isMarkingOne } = useMarkMyNotificationAsRead()
const { mutateAsync: markAllAsRead, isPending: isMarkingAll } = useMarkAllMyNotificationsAsRead()

const notifications = computed(() => {
  const results = notificationsQuery.data.value?.results ?? []

  if (activeFilter.value === 'unread') {
    return results.filter(notification => !notification.read_at)
  }

  return results
})
const unreadCount = computed(() => unreadCountQuery.data.value?.unread_count ?? 0)
const totalResults = computed(() => notificationsQuery.data.value?.total_results ?? 0)
const activeFilterIndex = computed(() => filters.findIndex(filter => filter.value === activeFilter.value))

function handleFilterChange(index: number) {
  const filter = filters[index]

  if (!filter) {
    return
  }

  activeFilter.value = filter.value
}

function getNotificationTarget(notification: NotificationItem) {
  const orderId = typeof notification.data?.orderId === 'string'
    ? notification.data.orderId
    : null

  if (orderId) {
    return routes.orderDetail(orderId)
  }

  return routes.orders()
}

async function handleNotificationClick(notification: NotificationItem) {
  if (!notification.read_at) {
    await markAsRead(notification.id)
  }

  await navigateTo(getNotificationTarget(notification))
}
</script>

<template>
  <div class="mt-8 space-y-6">
    <div class="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-medium">
          Notifications
        </h1>
        <p class="text-sm text-zinc-500">
          Order updates and account activity for your storefront account.
        </p>
      </div>

      <UButton
        v-if="unreadCount > 0"
        color="gray"
        variant="ghost"
        :loading="isMarkingAll"
        @click="markAllAsRead()"
      >
        Mark all read
      </UButton>
    </div>

    <div class="text-sm text-zinc-500">
      {{ unreadCount }} unread · {{ totalResults }} total
    </div>

    <UTabs
      :items="filters"
      :model-value="activeFilterIndex"
      @change="handleFilterChange"
    />

    <div
      v-if="notificationsQuery.isLoading.value"
      class="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500"
    >
      Loading notifications...
    </div>

    <div
      v-else-if="notificationsQuery.isError.value"
      class="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-500"
    >
      Failed to load notifications.
    </div>

    <div
      v-else-if="notifications.length === 0"
      class="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500"
    >
      {{ activeFilter === 'unread' ? 'No unread notifications.' : 'No notifications yet.' }}
    </div>

    <div
      v-else
      class="space-y-3"
    >
      <button
        v-for="notification in notifications"
        :key="notification.id"
        type="button"
        class="w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:bg-zinc-50"
        :class="notification.read_at ? 'border-zinc-200' : 'border-primary-200 bg-primary-50/40'"
        :disabled="isMarkingOne"
        @click="handleNotificationClick(notification)"
      >
        <div class="mb-2 flex items-start justify-between gap-3">
          <div class="text-base font-medium text-zinc-900">
            {{ notification.title }}
          </div>
          <div class="shrink-0 text-xs text-zinc-500">
            {{ dayjs(notification.created_at).format('MMM DD, YYYY HH:mm') }}
          </div>
        </div>
        <div class="text-sm text-zinc-600">
          {{ notification.body }}
        </div>
      </button>
    </div>

    <div
      v-if="totalResults > limit"
      class="flex justify-end"
    >
      <UPagination
        v-model="page"
        :total="totalResults"
        :page-count="limit"
      />
    </div>
  </div>
</template>
