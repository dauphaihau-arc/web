<script setup lang="ts">
import dayjs from 'dayjs'
import { ICON_NAME_BY_ALIAS } from '../../foundation/app-icon.constants'
import AppTabs from '../../patterns/app-tabs/app-tabs.vue'

interface NotificationPopoverItem {
  id: string
  title: string
  body: string
  data?: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}

interface NotificationPopoverFilter {
  label: string
  value: string
}

const props = withDefaults(defineProps<{
  notifications: NotificationPopoverItem[]
  unreadCount: number
  loading?: boolean
  error?: boolean
  isMarkingAll?: boolean
  isMarkingOne?: boolean
  filters?: NotificationPopoverFilter[]
  activeFilter?: string
  emptyText?: string
  showUnreadCount?: boolean
}>(), {
  loading: false,
  error: false,
  isMarkingAll: false,
  isMarkingOne: false,
  filters: () => [],
  activeFilter: 'all',
  emptyText: 'No notifications yet.',
  showUnreadCount: true,
})

const emit = defineEmits<{
  markAll: []
  itemClick: [notification: NotificationPopoverItem]
  filterChange: [value: string]
}>()

const filterItems = computed(() => props.filters.map(filter => ({
  label: filter.label,
  value: filter.value,
})))

const visibleUnreadCount = computed(() => props.notifications.filter(notification => !notification.read_at).length)

function formatNotificationTime(value: string) {
  const createdAt = dayjs(value)
  const now = dayjs()
  const minutesAgo = now.diff(createdAt, 'minute')

  if (minutesAgo < 1) {
    return 'Just now'
  }

  if (minutesAgo < 60) {
    return `${minutesAgo}m ago`
  }

  const hoursAgo = now.diff(createdAt, 'hour')

  if (hoursAgo < 24) {
    return `${hoursAgo}h ago`
  }

  if (createdAt.isSame(now.subtract(1, 'day'), 'day')) {
    return 'Yesterday'
  }

  if (createdAt.isSame(now, 'year')) {
    return createdAt.format('MMM DD')
  }

  return createdAt.format('MMM DD, YYYY')
}

function formatNotificationTitle(value: string) {
  return dayjs(value).format('MMM DD, YYYY HH:mm')
}


function handleFilterChange(value: string | number) {
  const filter = props.filters.find(item => item.value === String(value))

  if (!filter) {
    return
  }

  emit('filterChange', filter.value)
}
</script>

<template>
  <div class="flex max-h-[min(32rem,calc(100vh-5rem))] w-[25rem] max-w-[calc(100vw-2rem)] flex-col pt-3">
    <div
      class="flex items-center justify-between gap-3 px-3 pb-3"
      :class="filters.length === 0 ? 'border-b border-border-subtle' : ''"
    >
      <div class="text-lg font-semibold">
        Notifications
      </div>

      <UButton
        v-if="showUnreadCount && unreadCount > 0 && visibleUnreadCount > 0"
        size="xs"
        :loading="isMarkingAll"
        @click="emit('markAll')"
      >
        Mark all read
      </UButton>
    </div>

    <AppTabs
      v-if="filters.length > 0"
      variant="pill"
      size="xs"
      class="mb-3 px-3"
      :items="filterItems"
      :model-value="activeFilter"
      aria-label="Notification filters"
      @update:model-value="handleFilterChange"
    />

    <div
      v-if="filters.length > 0"
      class="border-b border-border-subtle"
    />

    <div class="scrollbar-subtle flex h-[min(25rem,calc(100vh-11rem))] flex-col overflow-y-auto overscroll-contain">
      <Empty
        v-if="loading"
        loading
        variant="naked"
        size="sm"
        description="Loading notifications..."
        container-class="flex-1"
      />

      <Empty
        v-else-if="error"
        variant="naked"
        size="sm"
        :icon="ICON_NAME_BY_ALIAS['warning']"
        description="Failed to load notifications."
        container-class="flex-1"
      />

      <Empty
        v-else-if="notifications.length === 0"
        variant="naked"
        size="sm"
        :icon="ICON_NAME_BY_ALIAS['bell']"
        :description="emptyText"
        container-class="flex-1"
      />

      <div
        v-else
      >
        <button
          v-for="notification in notifications"
          :key="notification.id"
          type="button"
          class="w-full border-b px-3 py-3 text-left transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isMarkingOne"
          @click="emit('itemClick', notification)"
        >
          <div class="mb-1 flex items-start justify-between gap-3">
            <div class="text-sm font-medium text-text-strong">
              {{ notification.title }}
            </div>
            <div
              class="shrink-0 text-xs text-text-muted"
              :title="formatNotificationTitle(notification.created_at)"
            >
              {{ formatNotificationTime(notification.created_at) }}
            </div>
          </div>
          <div class="text-sm text-text-subtle mt-2">
            {{ notification.body }}
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
