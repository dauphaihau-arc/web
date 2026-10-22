<script lang="ts" setup>
import type {
  ShopFinanceTransactionStatus,
  ShopFinanceTransactionType,
} from '~/domains/shop/api/finance/contracts/transactions.contract'
import type { ShopFinanceTransactionFilters } from '~/domains/shop/queries/transactions.query'
import DateFilterPanel from '~/shared/ui/date-filter/date-filter-panel.vue'
import type { OrderDateFilterDraft } from '~/shared/ui/date-filter/filter-draft.types'
import FilterPopover from '~/shared/ui/data-filter/filter-popover.vue'
import FilterToolbar from '~/shared/ui/data-filter/filter-toolbar.vue'
import {
  buildTransactionsDateRange,
  createDefaultTransactionsDateFilter,
  formatTransactionsDateFilterSummary,
  isTransactionsDateFilterValid,
} from './transactions-date-filter'

const emit = defineEmits<{
  change: [payload: ShopFinanceTransactionFilters]
  resetPage: []
}>()

const typeOptions: Array<{ label: string, value: ShopFinanceTransactionType | '' }> = [
  { label: 'All types', value: '' },
  { label: 'Order income', value: 'order_income' },
  { label: 'Refund', value: 'refund' },
  { label: 'Payout', value: 'payout' },
]

const statusOptions: Array<{ label: string, value: ShopFinanceTransactionStatus | '' }> = [
  { label: 'All statuses', value: '' },
  { label: 'Released', value: 'released' },
  { label: 'Pending', value: 'pending' },
  { label: 'Deducted', value: 'deducted' },
  { label: 'Paid', value: 'paid' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Failed', value: 'failed' },
]

const appliedType = ref<ShopFinanceTransactionType | ''>('')
const appliedStatus = ref<ShopFinanceTransactionStatus | ''>('')
const appliedDateFilter = ref<OrderDateFilterDraft | null>(null)

const typeDraft = ref<ShopFinanceTransactionType | ''>('')
const statusDraft = ref<ShopFinanceTransactionStatus | ''>('')
const dateFilterDraft = ref<OrderDateFilterDraft>(createDefaultTransactionsDateFilter())
const openFilter = ref<'type' | 'status' | 'date' | null>(null)

const hasActiveTypeFilter = computed(() => appliedType.value !== '')
const hasActiveStatusFilter = computed(() => appliedStatus.value !== '')
const hasActiveDateFilter = computed(() => appliedDateFilter.value !== null)
const hasActiveFilters = computed(() =>
  hasActiveTypeFilter.value
  || hasActiveStatusFilter.value
  || hasActiveDateFilter.value,
)

const typeFilterSummary = computed(() =>
  typeOptions.find(option => option.value === appliedType.value)?.label,
)

const statusFilterSummary = computed(() =>
  statusOptions.find(option => option.value === appliedStatus.value)?.label,
)

const dateFilterSummary = computed(() =>
  formatTransactionsDateFilterSummary(appliedDateFilter.value),
)

const query = computed<ShopFinanceTransactionFilters>(() => {
  const nextQuery: ShopFinanceTransactionFilters = {}

  if (appliedType.value) {
    nextQuery.type = appliedType.value
  }

  if (appliedStatus.value) {
    nextQuery.status = appliedStatus.value
  }

  if (appliedDateFilter.value) {
    const { from, to } = buildTransactionsDateRange(appliedDateFilter.value)

    if (from) {
      nextQuery.from = from
    }

    if (to) {
      nextQuery.to = to
    }
  }

  return nextQuery
})

watch(query, () => {
  emit('change', query.value)
}, { immediate: true })

function applyTypeFilter() {
  appliedType.value = typeDraft.value
  emit('resetPage')
}

function clearTypeFilter() {
  appliedType.value = ''
  typeDraft.value = ''
  emit('resetPage')
}

function applyStatusFilter() {
  appliedStatus.value = statusDraft.value
  emit('resetPage')
}

function clearStatusFilter() {
  appliedStatus.value = ''
  statusDraft.value = ''
  emit('resetPage')
}

function applyDateFilter() {
  if (!isTransactionsDateFilterValid(dateFilterDraft.value)) {
    appliedDateFilter.value = null
    dateFilterDraft.value = createDefaultTransactionsDateFilter()
  }
  else {
    appliedDateFilter.value = cloneDateFilter(dateFilterDraft.value)
  }

  emit('resetPage')
}

function clearDateFilter() {
  appliedDateFilter.value = null
  dateFilterDraft.value = createDefaultTransactionsDateFilter()
  emit('resetPage')
}

function clearAllFilters() {
  openFilter.value = null
  appliedType.value = ''
  typeDraft.value = ''
  appliedStatus.value = ''
  statusDraft.value = ''
  appliedDateFilter.value = null
  dateFilterDraft.value = createDefaultTransactionsDateFilter()
  emit('resetPage')
}

function updateOpenFilter(filter: 'type' | 'status' | 'date', open: boolean) {
  if (open) {
    openFilter.value = filter
    return
  }

  if (openFilter.value === filter) {
    openFilter.value = null
  }
}

function cloneDateFilter(filter: OrderDateFilterDraft): OrderDateFilterDraft {
  return {
    ...filter,
    date: filter.date ? new Date(filter.date) : null,
    startDate: filter.startDate ? new Date(filter.startDate) : null,
    endDate: filter.endDate ? new Date(filter.endDate) : null,
  }
}
</script>

<template>
  <FilterToolbar class="mb-6">
    <FilterPopover
      :open="openFilter === 'type'"
      label="Type"
      :active="hasActiveTypeFilter"
      :value="typeFilterSummary"
      panel-class="w-[min(92vw,220px)]"
      @update:open="updateOpenFilter('type', $event)"
      @apply="applyTypeFilter"
      @clear="clearTypeFilter"
    >
      <USelectMenu
        v-model="typeDraft"
        :options="typeOptions"
        value-attribute="value"
        option-attribute="label"
        class="w-full"
        data-testid="transactions-filter-type"
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
      <USelectMenu
        v-model="statusDraft"
        :options="statusOptions"
        value-attribute="value"
        option-attribute="label"
        class="w-full"
        data-testid="transactions-filter-status"
      />
    </FilterPopover>

    <FilterPopover
      :open="openFilter === 'date'"
      label="Date and time"
      :active="hasActiveDateFilter"
      :value="dateFilterSummary"
      :apply-disabled="!isTransactionsDateFilterValid(dateFilterDraft)"
      @update:open="updateOpenFilter('date', $event)"
      @apply="applyDateFilter"
      @clear="clearDateFilter"
    >
      <DateFilterPanel v-model="dateFilterDraft" />
    </FilterPopover>

    <UButton
      v-if="hasActiveFilters"
      variant="ghost"
      class="rounded-full"
      data-testid="transactions-clear-filters"
      @click="clearAllFilters"
    >
      Clear filters
    </UButton>
  </FilterToolbar>
</template>
