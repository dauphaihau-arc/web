<script lang="ts" setup>
import type { ShopFinancePayout } from '~/domains/shop/api/finance/contracts/payout.contract'
import FilterPopover from '~/shared/ui/data-filter/filter-popover.vue'
import FilterToolbar from '~/shared/ui/data-filter/filter-toolbar.vue'
import type { FilterOption } from '~/shared/ui/data-filter/types'
import StatusFilterPanel from '~/app/pages/orders/_components/order-filter-toolbar/status-filter-panel.vue'
import type { PayoutFilters } from './payout-filters'

const emit = defineEmits<{
  change: [payload: PayoutFilters]
  resetPage: []
}>()

const stateOptions: FilterOption[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Paid', value: 'paid' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Failed', value: 'failed' },
]

const sourceOptions: FilterOption[] = [
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Manual', value: 'manual' },
]

const appliedStates = ref<ShopFinancePayout['state'][]>([])
const appliedSources = ref<ShopFinancePayout['source'][]>([])

const stateDraft = ref<string[]>([])
const sourceDraft = ref<string[]>([])
const openFilter = ref<'state' | 'source' | null>(null)

const hasActiveStateFilter = computed(() => appliedStates.value.length > 0)
const hasActiveSourceFilter = computed(() => appliedSources.value.length > 0)
const hasActiveFilters = computed(() =>
  hasActiveStateFilter.value || hasActiveSourceFilter.value,
)

const stateFilterSummary = computed(() =>
  stateOptions
    .filter(option => appliedStates.value.includes(option.value as ShopFinancePayout['state']))
    .map(option => option.label)
    .join(', '),
)

const sourceFilterSummary = computed(() =>
  sourceOptions
    .filter(option => appliedSources.value.includes(option.value as ShopFinancePayout['source']))
    .map(option => option.label)
    .join(', '),
)

const query = computed<PayoutFilters>(() => ({
  states: [...appliedStates.value],
  sources: [...appliedSources.value],
}))

watch(query, () => {
  emit('change', query.value)
}, { immediate: true, deep: true })

function applyStateFilter() {
  appliedStates.value = stateDraft.value as ShopFinancePayout['state'][]
  emit('resetPage')
}

function clearStateFilter() {
  appliedStates.value = []
  stateDraft.value = []
  emit('resetPage')
}

function applySourceFilter() {
  appliedSources.value = sourceDraft.value as ShopFinancePayout['source'][]
  emit('resetPage')
}

function clearSourceFilter() {
  appliedSources.value = []
  sourceDraft.value = []
  emit('resetPage')
}

function clearAllFilters() {
  openFilter.value = null
  appliedStates.value = []
  stateDraft.value = []
  appliedSources.value = []
  sourceDraft.value = []
  emit('resetPage')
}

function updateOpenFilter(filter: 'state' | 'source', open: boolean) {
  if (open) {
    openFilter.value = filter
    return
  }

  if (openFilter.value === filter) {
    openFilter.value = null
  }
}
</script>

<template>
  <FilterToolbar class="mb-6">
    <FilterPopover
      :open="openFilter === 'state'"
      label="State"
      :active="hasActiveStateFilter"
      :value="stateFilterSummary || undefined"
      panel-class="w-[min(92vw,190px)]"
      @update:open="updateOpenFilter('state', $event)"
      @apply="applyStateFilter"
      @clear="clearStateFilter"
    >
      <StatusFilterPanel
        v-model="stateDraft"
        :options="stateOptions"
      />
    </FilterPopover>

    <FilterPopover
      :open="openFilter === 'source'"
      label="Source"
      :active="hasActiveSourceFilter"
      :value="sourceFilterSummary || undefined"
      panel-class="w-[min(92vw,190px)]"
      @update:open="updateOpenFilter('source', $event)"
      @apply="applySourceFilter"
      @clear="clearSourceFilter"
    >
      <StatusFilterPanel
        v-model="sourceDraft"
        :options="sourceOptions"
      />
    </FilterPopover>

    <UButton
      v-if="hasActiveFilters"
      variant="ghost"
      class="rounded-full"
      data-testid="payouts-clear-filters"
      @click="clearAllFilters"
    >
      Clear filters
    </UButton>
  </FilterToolbar>
</template>
