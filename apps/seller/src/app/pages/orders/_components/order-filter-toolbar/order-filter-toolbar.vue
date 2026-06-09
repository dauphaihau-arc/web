<script lang="ts" setup>
import dayjs from 'dayjs'
import { MarketCurrencies } from '@arc/enums/market'
import type { OrderShippingStatuses, OrderStatuses } from '@arc/enums/order'
import { currencyOptions, toCurrencyOption, toMinorUnits } from '@arc/utils'
import {
  orderFulfillmentFilterOptions,
  orderStatusFilterOptions,
} from '../order-status-filter-options'
import DateFilterPanel from '../../../../components/date-filter-panel/date-filter-panel.vue'
import AmountFilterPanel from './amount-filter-panel.vue'
import CurrencyFilterPanel from './currency-filter-panel.vue'
import StatusFilterPanel from './status-filter-panel.vue'
import {
  getDefaultDateFilterTimezone,
  getNowInTimezone,
  toZonedDay,
} from '~/app/components/date-filter-panel/date-filter-timezone'
import type {
  OrderAmountFilterDraft,
  OrderCurrencyFilterDraft,
  OrderDateFilterDraft,
} from '~/app/components/date-filter-panel/order-filter.types'
import FilterPopover from '~/app/components/filter/filter-popover.vue'
import FilterToolbar from '~/app/components/filter/filter-toolbar.vue'
import type { ListShopOrdersRequest } from '~/shared/api/shop/order/contracts/order.contract'
import { useGetMarketplaceConfig } from '~/shared/server-state/market/config.query'
import { useGetMyShop } from '~/shared/server-state/shop/my-shop.query'

const emit = defineEmits<{
  change: [payload: Partial<ListShopOrdersRequest>]
  resetPage: []
}>()

const fulfillmentOptions = orderFulfillmentFilterOptions
const statusOptions = orderStatusFilterOptions
const appliedStatusFilter = defineModel<OrderStatuses[]>('statusFilter', { default: () => [] })

const { data: marketplaceConfig } = useGetMarketplaceConfig()
const { data: myShop } = useGetMyShop()

const availableCurrencyOptions = computed(() => {
  const supportedCurrencies = new Set(
    (marketplaceConfig.value?.markets ?? [])
      .filter(market => market.enabled)
      .flatMap(market => market.supportedCurrencies),
  )

  if (myShop.value?.currency) {
    supportedCurrencies.add(myShop.value.currency)
  }

  if (supportedCurrencies.size === 0) {
    return currencyOptions
  }

  const filteredOptions = currencyOptions.filter(option => supportedCurrencies.has(option.id))

  if (myShop.value?.currency && !filteredOptions.some(option => option.id === myShop.value?.currency)) {
    return [toCurrencyOption(myShop.value.currency), ...filteredOptions]
  }

  return filteredOptions
})

const defaultAmountCurrency = computed(() =>
  myShop.value?.currency
  ?? availableCurrencyOptions.value[0]?.id
  ?? MarketCurrencies.USD,
)

const searchDraft = ref('')
const appliedSearch = ref('')
const dateFilterDraft = ref<OrderDateFilterDraft>(createDefaultDateFilter())
const appliedDateFilter = ref<OrderDateFilterDraft | null>(null)
const amountFilterDraft = ref<OrderAmountFilterDraft>(createDefaultAmountFilter())
const appliedAmountFilter = ref<OrderAmountFilterDraft | null>(null)
const currencyFilterDraft = ref<OrderCurrencyFilterDraft>(createDefaultCurrencyFilter(defaultAmountCurrency.value))
const appliedCurrencyFilter = ref<OrderCurrencyFilterDraft | null>(null)
const fulfillmentFilterDraft = ref<OrderShippingStatuses[]>([])
const appliedFulfillmentFilter = ref<OrderShippingStatuses[]>([])
const statusFilterDraft = ref<OrderStatuses[]>([...appliedStatusFilter.value])
const openFilter = ref<'search' | 'date' | 'amount' | 'currency' | 'fulfillment' | 'status' | null>(null)

const hasActiveSearchFilter = computed(() => appliedSearch.value.length > 0)
const hasActiveDateFilter = computed(() => appliedDateFilter.value !== null)
const hasActiveAmountFilter = computed(() => appliedAmountFilter.value !== null)
const hasActiveCurrencyFilter = computed(() => appliedCurrencyFilter.value !== null)
const hasActiveFulfillmentFilter = computed(() => appliedFulfillmentFilter.value.length > 0)
const hasActiveStatusFilter = computed(() => appliedStatusFilter.value.length > 0)
const hasActiveFilters = computed(() =>
  hasActiveSearchFilter.value
  || hasActiveDateFilter.value
  || hasActiveAmountFilter.value
  || hasActiveCurrencyFilter.value
  || hasActiveFulfillmentFilter.value
  || hasActiveStatusFilter.value,
)

const searchFilterSummary = computed(() =>
  appliedSearch.value || undefined,
)

const dateFilterSummary = computed(() => {
  const filter = appliedDateFilter.value

  if (!filter) {
    return undefined
  }

  switch (filter.operator) {
    case 'in_last':
      return `Last ${filter.amount} ${filter.unit}`
    case 'eq':
      return formatAbsoluteDateSummary(filter.date, filter.includeTime, filter.time, filter.timezone)
    case 'between':
      if (!filter.startDate || !filter.endDate) {
        return undefined
      }
      return `${formatAbsoluteDateSummary(filter.startDate, filter.includeTime, filter.startTime, filter.timezone)} - ${formatAbsoluteDateSummary(filter.endDate, filter.includeTime, filter.endTime, filter.timezone)}`
    case 'gte':
      return `On or after ${formatAbsoluteDateSummary(filter.date, filter.includeTime, filter.time, filter.timezone)}`
    case 'lte':
      return `Before or on ${formatAbsoluteDateSummary(filter.date, filter.includeTime, filter.time, filter.timezone)}`
    default:
      return undefined
  }
})

const amountFilterSummary = computed(() => {
  const filter = appliedAmountFilter.value

  if (!filter) {
    return undefined
  }

  const operatorLabel = {
    eq: 'Exactly',
    gte: 'More than',
    lte: 'Less than',
  }[filter.operator]

  return `${operatorLabel} ${filter.amount}`
})

const fulfillmentFilterSummary = computed(() => {
  if (appliedFulfillmentFilter.value.length === 0) {
    return undefined
  }

  return fulfillmentOptions
    .filter(option => appliedFulfillmentFilter.value.includes(option.value as OrderShippingStatuses))
    .map(option => option.label)
    .join(', ')
})

const statusFilterSummary = computed(() => {
  if (appliedStatusFilter.value.length === 0) {
    return undefined
  }

  return statusOptions
    .filter(option => appliedStatusFilter.value.includes(option.value as OrderStatuses))
    .map(option => option.label)
    .join(', ')
})

const currencyFilterSummary = computed(() => {
  if (!appliedCurrencyFilter.value) {
    return undefined
  }

  return appliedCurrencyFilter.value.currency
})

const query = computed<Partial<ListShopOrdersRequest>>(() => {
  const nextQuery: Partial<ListShopOrdersRequest> = {}

  if (appliedSearch.value.trim()) {
    nextQuery.search = appliedSearch.value.trim()
  }

  if (appliedStatusFilter.value.length > 0) {
    nextQuery.status = [...appliedStatusFilter.value]
  }

  if (appliedFulfillmentFilter.value.length > 0) {
    nextQuery.shipping_status = [...appliedFulfillmentFilter.value]
  }

  if (appliedAmountFilter.value) {
    const amount = Number(appliedAmountFilter.value.amount)
    const currency = appliedCurrencyFilter.value?.currency ?? defaultAmountCurrency.value

    if (Number.isFinite(amount) && amount >= 0) {
      const amountMinor = toMinorUnits(amount, currency)

      nextQuery.currency = [currency]

      switch (appliedAmountFilter.value.operator) {
        case 'eq':
          nextQuery.amount_min = amountMinor
          nextQuery.amount_max = amountMinor
          break
        case 'gte':
          nextQuery.amount_min = amountMinor
          break
        case 'lte':
          nextQuery.amount_max = amountMinor
          break
      }
    }
  }
  else if (appliedCurrencyFilter.value) {
    nextQuery.currency = [appliedCurrencyFilter.value.currency]
  }

  if (appliedDateFilter.value) {
    const { createdFrom, createdTo } = buildCreatedAtRange(appliedDateFilter.value)

    if (createdFrom) {
      nextQuery.created_from = createdFrom
    }

    if (createdTo) {
      nextQuery.created_to = createdTo
    }
  }

  return nextQuery
})

watch(query, () => {
  emit('change', query.value)
}, { immediate: true })

watch(appliedStatusFilter, (nextValue) => {
  statusFilterDraft.value = [...nextValue]
}, { deep: true })

watch(defaultAmountCurrency, (currency) => {
  if (!appliedCurrencyFilter.value) {
    currencyFilterDraft.value = createDefaultCurrencyFilter(currency)
  }
}, { immediate: true })

function createDefaultDateFilter(): OrderDateFilterDraft {
  return {
    operator: 'in_last',
    amount: '',
    unit: 'days',
    date: null,
    startDate: null,
    endDate: null,
    includeTime: false,
    time: '00:00',
    startTime: '00:00',
    endTime: '23:59',
    timezone: getDefaultDateFilterTimezone(),
  }
}

function createDefaultAmountFilter(): OrderAmountFilterDraft {
  return {
    operator: 'eq',
    amount: '',
  }
}

function createDefaultCurrencyFilter(currency: string): OrderCurrencyFilterDraft {
  return {
    currency,
  }
}

function applySearchFilter() {
  appliedSearch.value = searchDraft.value.trim()
  emit('resetPage')
}

function clearSearchFilter() {
  searchDraft.value = ''
  appliedSearch.value = ''
  emit('resetPage')
}

function applyDateFilter() {
  if (!isDateFilterValid(dateFilterDraft.value)) {
    appliedDateFilter.value = null
    dateFilterDraft.value = createDefaultDateFilter()
  }
  else {
    appliedDateFilter.value = cloneDateFilter(dateFilterDraft.value)
  }

  emit('resetPage')
}

function clearDateFilter() {
  appliedDateFilter.value = null
  dateFilterDraft.value = createDefaultDateFilter()
  emit('resetPage')
}

function applyAmountFilter() {
  const draft = amountFilterDraft.value
  const amount = Number(draft.amount)

  if (!Number.isFinite(amount) || amount < 0) {
    appliedAmountFilter.value = null
    amountFilterDraft.value = createDefaultAmountFilter()
  }
  else {
    appliedAmountFilter.value = { ...draft }

    if (!appliedCurrencyFilter.value) {
      appliedCurrencyFilter.value = { ...currencyFilterDraft.value }
    }
  }

  emit('resetPage')
}

function clearAmountFilter() {
  appliedAmountFilter.value = null
  amountFilterDraft.value = createDefaultAmountFilter()
  emit('resetPage')
}

function applyCurrencyFilter() {
  appliedCurrencyFilter.value = { ...currencyFilterDraft.value }
  emit('resetPage')
}

function clearCurrencyFilter() {
  appliedCurrencyFilter.value = null
  currencyFilterDraft.value = createDefaultCurrencyFilter(defaultAmountCurrency.value)
  emit('resetPage')
}

function applyFulfillmentFilter() {
  appliedFulfillmentFilter.value = [...fulfillmentFilterDraft.value]
  emit('resetPage')
}

function clearFulfillmentFilter() {
  appliedFulfillmentFilter.value = []
  fulfillmentFilterDraft.value = []
  emit('resetPage')
}

function applyStatusFilter() {
  appliedStatusFilter.value = [...statusFilterDraft.value]
  emit('resetPage')
}

function clearStatusFilter() {
  appliedStatusFilter.value = []
  statusFilterDraft.value = []
  emit('resetPage')
}

function clearAllFilters() {
  openFilter.value = null
  searchDraft.value = ''
  appliedSearch.value = ''
  appliedDateFilter.value = null
  dateFilterDraft.value = createDefaultDateFilter()
  appliedAmountFilter.value = null
  amountFilterDraft.value = createDefaultAmountFilter()
  appliedCurrencyFilter.value = null
  currencyFilterDraft.value = createDefaultCurrencyFilter(defaultAmountCurrency.value)
  appliedFulfillmentFilter.value = []
  fulfillmentFilterDraft.value = []
  appliedStatusFilter.value = []
  statusFilterDraft.value = []
  emit('resetPage')
}

function updateOpenFilter(
  filter: 'search' | 'date' | 'amount' | 'currency' | 'fulfillment' | 'status',
  open: boolean,
) {
  if (open) {
    openFilter.value = filter
    return
  }

  if (openFilter.value === filter) {
    openFilter.value = null
  }
}

function buildCreatedAtRange(filter: OrderDateFilterDraft) {
  const now = getNowInTimezone(filter.timezone)

  switch (filter.operator) {
    case 'in_last':
      return {
        createdFrom: now.subtract(Number(filter.amount), filter.unit).toISOString(),
        createdTo: now.toISOString(),
      }
    case 'eq': {
      if (!filter.date) {
        return {}
      }

      const selected = toZonedDay(filter.date, filter.timezone)

      if (filter.includeTime) {
        const selectedAtTime = applyTimeToDay(selected, filter.time)
        return {
          createdFrom: selectedAtTime.startOf('minute').toISOString(),
          createdTo: selectedAtTime.endOf('minute').toISOString(),
        }
      }

      return {
        createdFrom: selected.startOf('day').toISOString(),
        createdTo: selected.endOf('day').toISOString(),
      }
    }
    case 'between': {
      if (!filter.startDate || !filter.endDate) {
        return {}
      }

      const start = toZonedDay(filter.startDate, filter.timezone)
      const end = toZonedDay(filter.endDate, filter.timezone)

      return {
        createdFrom: (
          filter.includeTime
            ? applyTimeToDay(start, filter.startTime)
            : start.startOf('day')
        ).toISOString(),
        createdTo: (
          filter.includeTime
            ? applyTimeToDay(end, filter.endTime)
            : end.endOf('day')
        ).toISOString(),
      }
    }
    case 'gte': {
      if (!filter.date) {
        return {}
      }

      const selected = toZonedDay(filter.date, filter.timezone)
      return {
        createdFrom: (
          filter.includeTime
            ? applyTimeToDay(selected, filter.time).startOf('minute')
            : selected.startOf('day')
        ).toISOString(),
      }
    }
    case 'lte': {
      if (!filter.date) {
        return {}
      }

      const selected = toZonedDay(filter.date, filter.timezone)
      return {
        createdTo: (
          filter.includeTime
            ? applyTimeToDay(selected, filter.time).endOf('minute')
            : selected.endOf('day')
        ).toISOString(),
      }
    }
    default:
      return {}
  }
}

function applyTimeToDay(value: dayjs.Dayjs, time: string) {
  const [hoursRaw = '0', minutesRaw = '0'] = time.split(':')
  const hours = Number(hoursRaw)
  const minutes = Number(minutesRaw)

  return value
    .hour(Number.isFinite(hours) ? hours : 0)
    .minute(Number.isFinite(minutes) ? minutes : 0)
    .second(0)
    .millisecond(0)
}

function formatAbsoluteDateSummary(
  value: Date | null,
  includeTime: boolean,
  time: string,
  timezone: OrderDateFilterDraft['timezone'],
) {
  if (!value) {
    return undefined
  }

  const base = toZonedDay(value, timezone)

  if (!includeTime) {
    return base.format('MMM D, YYYY')
  }

  return applyTimeToDay(base, time).format('MMM D, YYYY hh:mm A')
}

function cloneDateFilter(filter: OrderDateFilterDraft): OrderDateFilterDraft {
  return {
    ...filter,
    date: filter.date ? new Date(filter.date) : null,
    startDate: filter.startDate ? new Date(filter.startDate) : null,
    endDate: filter.endDate ? new Date(filter.endDate) : null,
  }
}

function isDateFilterValid(filter: OrderDateFilterDraft) {
  switch (filter.operator) {
    case 'in_last': {
      const amount = Number(filter.amount)
      return Number.isFinite(amount) && amount > 0
    }
    case 'eq':
    case 'gte':
    case 'lte':
      return filter.date instanceof Date
        && !Number.isNaN(filter.date.valueOf())
        && (!filter.includeTime || isValidTime(filter.time))
    case 'between':
      return !!filter.startDate
        && !!filter.endDate
        && !Number.isNaN(filter.startDate.valueOf())
        && !Number.isNaN(filter.endDate.valueOf())
        && (!filter.includeTime || (isValidTime(filter.startTime) && isValidTime(filter.endTime)))
        && (
          dayjs(filter.endDate).isSame(dayjs(filter.startDate))
          || dayjs(filter.endDate).isAfter(dayjs(filter.startDate))
        )
    default:
      return false
  }
}

function isValidTime(value: string) {
  return /^\d{2}:\d{2}$/.test(value)
}
</script>

<template>
  <FilterToolbar>
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
      :open="openFilter === 'date'"
      label="Date and time"
      :active="hasActiveDateFilter"
      :value="dateFilterSummary"
      :apply-disabled="!isDateFilterValid(dateFilterDraft)"
      @update:open="updateOpenFilter('date', $event)"
      @apply="applyDateFilter"
      @clear="clearDateFilter"
    >
      <DateFilterPanel v-model="dateFilterDraft" />
    </FilterPopover>

    <FilterPopover
      :open="openFilter === 'amount'"
      label="Amount"
      :active="hasActiveAmountFilter"
      :value="amountFilterSummary"
      :apply-disabled="!amountFilterDraft.amount"
      panel-class="w-[min(92vw,300px)]"
      @update:open="updateOpenFilter('amount', $event)"
      @apply="applyAmountFilter"
      @clear="clearAmountFilter"
    >
      <AmountFilterPanel v-model="amountFilterDraft" />
    </FilterPopover>

    <FilterPopover
      :open="openFilter === 'currency'"
      label="Currency"
      :active="hasActiveCurrencyFilter"
      :value="currencyFilterSummary"
      panel-class="w-[min(92vw,300px)]"
      @update:open="updateOpenFilter('currency', $event)"
      @apply="applyCurrencyFilter"
      @clear="clearCurrencyFilter"
    >
      <CurrencyFilterPanel
        v-model="currencyFilterDraft"
        :currency-options="availableCurrencyOptions"
      />
    </FilterPopover>

    <FilterPopover
      :open="openFilter === 'fulfillment'"
      label="Fulfillment"
      :active="hasActiveFulfillmentFilter"
      :value="fulfillmentFilterSummary"
      panel-class="w-[min(92vw,190px)]"
      @update:open="updateOpenFilter('fulfillment', $event)"
      @apply="applyFulfillmentFilter"
      @clear="clearFulfillmentFilter"
    >
      <StatusFilterPanel
        v-model="fulfillmentFilterDraft"
        :options="fulfillmentOptions"
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
      <StatusFilterPanel
        v-model="statusFilterDraft"
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
