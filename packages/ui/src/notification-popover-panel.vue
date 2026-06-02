<script setup lang="ts">
import dayjs from 'dayjs'

interface NotificationPopoverItem {
  id: string
  title: string
  body: string
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
  <div class="w-[22rem] max-w-[calc(100vw-2rem)] p-3">
    <div class="mb-3 flex items-center justify-between gap-3">
      <div>
        <div class="text-sm font-semibold">
          Notifications
        </div>
        <div
          v-if="showUnreadCount"
          class="text-xs text-gray-500"
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

    <div
      v-if="loading"
      class="py-6 text-center text-sm text-gray-500"
    >
      Loading notifications...
    </div>

    <div
      v-else-if="error"
      class="py-6 text-center text-sm text-red-500"
    >
      Failed to load notifications.
    </div>

    <div
      v-else-if="notifications.length === 0"
      class="py-6 text-center text-sm text-gray-500"
    >
      {{ emptyText }}
    </div>

    <div
      v-else
      class="space-y-2"
    >
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

      <button
        v-for="notification in notifications"
        :key="notification.id"
        type="button"
        class="w-full border-b py-3 text-left transition hover:bg-gray-50"
        :class="notification.read_at ? 'border-gray-200' : 'border-[#edf1e6] bg-primary-50/40'"
        :disabled="isMarkingOne"
        @click="emit('itemClick', notification)"
      >
        <div class="mb-1 flex items-start justify-between gap-3">
          <div class="text-sm font-medium text-gray-900">
            {{ notification.title }}
          </div>
          <div class="shrink-0 text-xs text-gray-500">
            {{ dayjs(notification.created_at).format('MMM DD, HH:mm') }}
          </div>
        </div>
        <div class="text-sm text-gray-600">
          {{ notification.body }}
        </div>
      </button>
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
