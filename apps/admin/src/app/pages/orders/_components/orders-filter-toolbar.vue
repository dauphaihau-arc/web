<script setup lang="ts">
import type { OrderStatuses } from '@arc/enums/order'
import FilterPopover from '@arc/ui/patterns/data-filter/filter-popover.vue'
import FilterToolbar from '@arc/ui/patterns/data-filter/filter-toolbar.vue'
import MultiSelectPanel from '@arc/ui/patterns/data-filter/multi-select-panel.vue'
import { summarizeFilterLabels } from '@arc/ui/patterns/data-filter/summary'
import { ADMIN_ORDER_STATUS_OPTIONS } from '~/domains/orders/utils/order-presentation'

const emit = defineEmits<{
  resetPage: []
}>()

const search = defineModel<string>('search', { required: true })
const status = defineModel<OrderStatuses[]>('status', { required: true })

const statusOptions = ADMIN_ORDER_STATUS_OPTIONS

const searchDraft = ref(search.value)
const statusDraft = ref<string[]>([...status.value])
const openFilter = ref<'search' | 'status' | null>(null)

const hasActiveSearchFilter = computed(() => search.value.trim().length > 0)
const hasActiveStatusFilter = computed(() => status.value.length > 0)
const hasActiveFilters = computed(() =>
  hasActiveSearchFilter.value || hasActiveStatusFilter.value,
)

const searchFilterSummary = computed(() =>
  hasActiveSearchFilter.value ? search.value : undefined,
)

const statusFilterSummary = computed(() => {
  if (status.value.length === 0) {
    return undefined
  }

  return summarizeFilterLabels(
    statusOptions
      .filter(option => status.value.includes(option.value))
      .map(option => option.label),
  )
})

watch(status, (nextValue) => {
  statusDraft.value = [...nextValue]
}, { deep: true })

function updateOpenFilter(name: 'search' | 'status', isOpen: boolean) {
  if (!isOpen) {
    if (openFilter.value === name) {
      openFilter.value = null
    }

    return
  }

  if (name === 'search') {
    searchDraft.value = search.value
  }
  else {
    statusDraft.value = [...status.value]
  }

  openFilter.value = name
}

function applySearchFilter() {
  const nextValue = searchDraft.value.trim()

  if (!nextValue) {
    return
  }

  search.value = nextValue
  emit('resetPage')
}

function clearSearchFilter() {
  searchDraft.value = ''
  search.value = ''
  emit('resetPage')
}

function applyStatusFilter() {
  status.value = [...statusDraft.value] as OrderStatuses[]
  emit('resetPage')
}

function clearStatusFilter() {
  statusDraft.value = []
  status.value = []
  emit('resetPage')
}

function clearAllFilters() {
  clearSearchFilter()
  clearStatusFilter()
}
</script>

<template>
  <FilterToolbar class="mb-6">
    <FilterPopover
      :open="openFilter === 'search'"
      label="Search"
      :active="hasActiveSearchFilter"
      :value="searchFilterSummary"
      :apply-disabled="!searchDraft.trim()"
      @update:open="updateOpenFilter('search', $event)"
      @apply="applySearchFilter"
      @clear="clearSearchFilter"
    >
      <UInput
        v-model="searchDraft"
        placeholder="Search order number or customer email"
        autofocus
      />
    </FilterPopover>

    <FilterPopover
      :open="openFilter === 'status'"
      label="Status"
      :active="hasActiveStatusFilter"
      :value="statusFilterSummary"
      panel-class="w-[min(92vw,220px)]"
      @update:open="updateOpenFilter('status', $event)"
      @apply="applyStatusFilter"
      @clear="clearStatusFilter"
    >
      <MultiSelectPanel
        v-model="statusDraft"
        :options="statusOptions"
      />
    </FilterPopover>

    <UButton
      v-if="hasActiveFilters"
      variant="ghost"
      class="rounded-full"
      @click="clearAllFilters"
    >
      Clear filters
    </UButton>
  </FilterToolbar>
</template>
