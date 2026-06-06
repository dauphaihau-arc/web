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
    <AppPanel>
      <SectionHeader
        title="Notifications"
        description="Order updates and account activity for your storefront account."
      >
        <template
          v-if="unreadCount > 0"
          #actions
        >
          <UButton
            color="gray"
            variant="ghost"
            :loading="isMarkingAll"
            @click="markAllAsRead()"
          >
            Mark all read
          </UButton>
        </template>
      </SectionHeader>
    </AppPanel>

    <div class="text-sm text-text-muted">
      {{ unreadCount }} unread · {{ totalResults }} total
    </div>

    <UTabs
      :items="filters"
      :model-value="activeFilterIndex"
      @change="handleFilterChange"
    />

    <AppStateBlock
      v-if="notificationsQuery.isLoading.value"
    >
      Loading notifications...
    </AppStateBlock>

    <AppStateBlock
      v-else-if="notificationsQuery.isError.value"
      state="danger"
    >
      Failed to load notifications.
    </AppStateBlock>

    <AppStateBlock
      v-else-if="notifications.length === 0"
    >
      {{ activeFilter === 'unread' ? 'No unread notifications.' : 'No notifications yet.' }}
    </AppStateBlock>

    <div
      v-else
      class="space-y-3"
    >
      <AppPanel
        v-for="notification in notifications"
        :key="notification.id"
        as="button"
        padding="sm"
        class="w-full text-left transition hover:bg-surface-muted"
        :class="notification.read_at ? 'border-border-subtle' : 'border-border-accent bg-surface-accent'"
        :disabled="isMarkingOne"
        @click="handleNotificationClick(notification)"
      >
        <div class="mb-2 flex items-start justify-between gap-3">
          <div class="text-base font-medium text-text-strong">
            {{ notification.title }}
          </div>
          <div class="shrink-0 text-xs text-text-muted">
            {{ dayjs(notification.created_at).format('MMM DD, YYYY HH:mm') }}
          </div>
        </div>
        <div class="text-sm text-text-subtle">
          {{ notification.body }}
        </div>
      </AppPanel>
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
