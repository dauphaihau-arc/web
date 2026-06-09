<script setup lang="ts">
import dayjs from 'dayjs'

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
  viewAllLabel?: string
}>(), {
  loading: false,
  error: false,
  isMarkingAll: false,
  isMarkingOne: false,
  filters: () => [],
  activeFilter: 'all',
  emptyText: 'No notifications yet.',
  showUnreadCount: true,
  viewAllLabel: 'View all',
})

const emit = defineEmits<{
  markAll: []
  viewAll: []
  itemClick: [notification: NotificationPopoverItem]
  filterChange: [value: string]
}>()

const activeFilterIndex = computed(() => props.filters.findIndex(filter => filter.value === props.activeFilter))

function handleFilterChange(index: number) {
  const filter = props.filters[index]

  if (!filter) {
    return
  }

  emit('filterChange', filter.value)
}
</script>

<template>
  <div class="flex max-h-[min(32rem,calc(100vh-5rem))] w-[22rem] max-w-[calc(100vw-2rem)] flex-col p-3">
    <div class="mb-3 flex items-center justify-between gap-3">
      <div>
        <div class="text-sm font-semibold">
          Notifications
        </div>
        <div
          v-if="showUnreadCount"
          class="text-xs text-text-muted"
        >
          {{ unreadCount }} unread
        </div>
      </div>

      <UButton
        v-if="unreadCount > 0"
        size="xs"
        :loading="isMarkingAll"
        @click="emit('markAll')"
      >
        Mark all read
      </UButton>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain pe-3">
      <UTabs
        v-if="filters.length > 0"
        class="mb-2 w-full"
        :items="filters"
        :model-value="activeFilterIndex"
        :ui="{
          list: {
            width: 'w-full md:w-full',
            tab: {
              base: 'flex-1 justify-center',
            },
          },
        }"
        @change="handleFilterChange"
      />

      <AppStateBlock
        v-if="loading"
        class="border-0 bg-transparent px-0 py-6 text-text-muted shadow-none"
      >
        Loading notifications...
      </AppStateBlock>

      <AppStateBlock
        v-else-if="error"
        state="danger"
        class="border-0 bg-transparent px-0 py-6 shadow-none"
      >
        Failed to load notifications.
      </AppStateBlock>

      <AppStateBlock
        v-else-if="notifications.length === 0"
        class="border-0 bg-transparent px-0 py-6 text-text-muted shadow-none"
      >
        {{ emptyText }}
      </AppStateBlock>

      <div
        v-else
        class="space-y-2"
      >
        <button
          v-for="notification in notifications"
          :key="notification.id"
          type="button"
          class="w-full border-b py-3 text-left"
          :disabled="isMarkingOne"
          @click="emit('itemClick', notification)"
        >
          <div class="mb-1 flex items-start justify-between gap-3">
            <div class="text-sm font-medium text-text-strong">
              {{ notification.title }}
            </div>
            <div class="shrink-0 text-xs text-text-muted">
              {{ dayjs(notification.created_at).format('MMM DD, HH:mm') }}
            </div>
          </div>
          <div class="text-sm text-text-subtle">
            {{ notification.body }}
          </div>
        </button>
      </div>
    </div>

    <div class="mt-3 flex justify-end">
      <UButton
        variant="ghost"
        size="xs"
        @click="emit('viewAll')"
      >
        {{ viewAllLabel }}
      </UButton>
    </div>
  </div>
</template>
