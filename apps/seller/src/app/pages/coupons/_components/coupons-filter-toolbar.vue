<script lang="ts" setup>
import dayjs from 'dayjs'
import DateFilterPanel from '../../../components/date-filter-panel/date-filter-panel.vue'
import type { OrderDateFilterDraft } from '../../../components/date-filter-panel/order-filter.types'
import {
  getDefaultDateFilterTimezone,
  getNowInTimezone,
  toZonedDay,
} from '../../../components/date-filter-panel/date-filter-timezone'
import type { CouponTypeFilter } from './coupon-type-filter-options'
import type { ListShopCouponsRequest } from '~/shared/api/shop/coupon/contracts/coupon.contract'
import FilterPopover from '~/app/components/filter/filter-popover.vue'
import FilterToolbar from '~/app/components/filter/filter-toolbar.vue'

const emit = defineEmits<{
  change: [payload: Partial<ListShopCouponsRequest>]
  resetPage: []
}>()

const appliedCouponType = defineModel<CouponTypeFilter | undefined>('typeFilter')

const codeDraft = ref('')
const appliedCode = ref('')
const couponTypeDraft = ref<CouponTypeFilter | undefined>()
const dateFilterDraft = ref<OrderDateFilterDraft>(createDefaultDateFilter())
const appliedDateFilter = ref<OrderDateFilterDraft | null>(null)
const openFilter = ref<'date' | 'code' | 'type' | null>(null)

const hasActiveDateFilter = computed(() => appliedDateFilter.value !== null)
const hasActiveCodeFilter = computed(() => appliedCode.value.length > 0)
const hasActiveTypeFilter = computed(() => !!appliedCouponType.value)
const hasActiveFilters = computed(() =>
  hasActiveDateFilter.value
  || hasActiveCodeFilter.value
  || hasActiveTypeFilter.value,
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

const query = computed<Partial<ListShopCouponsRequest>>(() => {
  const nextQuery: Partial<ListShopCouponsRequest> = {}

  if (appliedDateFilter.value) {
    const { activeFrom, activeTo } = buildActiveRange(appliedDateFilter.value)

    if (activeFrom) {
      nextQuery.active_from = activeFrom
    }

    if (activeTo) {
      nextQuery.active_to = activeTo
    }
  }

  if (appliedCode.value.trim()) {
    nextQuery.code = appliedCode.value.trim()
  }

  if (appliedCouponType.value) {
    nextQuery.is_auto_sale = appliedCouponType.value === 'sale'
  }

  return nextQuery
})

watch(query, () => {
  emit('change', query.value)
}, { immediate: true })

watch(appliedCouponType, (nextValue) => {
  couponTypeDraft.value = nextValue
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

function applyCodeFilter() {
  appliedCode.value = codeDraft.value.trim()
  emit('resetPage')
}

function clearCodeFilter() {
  codeDraft.value = ''
  appliedCode.value = ''
  emit('resetPage')
}

function clearAllFilters() {
  openFilter.value = null
  appliedDateFilter.value = null
  dateFilterDraft.value = createDefaultDateFilter()
  codeDraft.value = ''
  appliedCode.value = ''
  couponTypeDraft.value = undefined
  appliedCouponType.value = undefined
  emit('resetPage')
}

function updateOpenFilter(filter: 'date' | 'code' | 'type', open: boolean) {
  if (open) {
    openFilter.value = filter
    return
  }

  if (openFilter.value === filter) {
    openFilter.value = null
  }
}

function buildActiveRange(filter: OrderDateFilterDraft) {
  const now = getNowInTimezone(filter.timezone)

  switch (filter.operator) {
    case 'in_last':
      return {
        activeFrom: now.subtract(Number(filter.amount), filter.unit).toISOString(),
        activeTo: now.toISOString(),
      }
    case 'eq': {
      if (!filter.date) {
        return {}
      }

      const selected = toZonedDay(filter.date, filter.timezone)

      if (filter.includeTime) {
        const selectedAtTime = applyTimeToDay(selected, filter.time)
        return {
          activeFrom: selectedAtTime.startOf('minute').toISOString(),
          activeTo: selectedAtTime.endOf('minute').toISOString(),
        }
      }

      return {
        activeFrom: selected.startOf('day').toISOString(),
        activeTo: selected.endOf('day').toISOString(),
      }
    }
    case 'between': {
      if (!filter.startDate || !filter.endDate) {
        return {}
      }

      const start = toZonedDay(filter.startDate, filter.timezone)
      const end = toZonedDay(filter.endDate, filter.timezone)

      return {
        activeFrom: (
          filter.includeTime
            ? applyTimeToDay(start, filter.startTime)
            : start.startOf('day')
        ).toISOString(),
        activeTo: (
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
        activeFrom: (
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
        activeTo: (
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
      :open="openFilter === 'date'"
      label="Start - End Date"
      :active="hasActiveDateFilter"
      :value="dateFilterSummary"
      :apply-disabled="!isDateFilterValid(dateFilterDraft)"
      panel-class="w-[min(92vw,380px)]"
      @update:open="updateOpenFilter('date', $event)"
      @apply="applyDateFilter"
      @clear="clearDateFilter"
    >
      <DateFilterPanel v-model="dateFilterDraft" />
    </FilterPopover>

    <FilterPopover
      :open="openFilter === 'code'"
      label="Code"
      :active="hasActiveCodeFilter"
      :value="appliedCode || undefined"
      :apply-disabled="!codeDraft.trim()"
      @update:open="updateOpenFilter('code', $event)"
      @apply="applyCodeFilter"
      @clear="clearCodeFilter"
    >
      <UInput
        v-model="codeDraft"
        placeholder="Search coupon code"
        autofocus
      />
    </FilterPopover>

    <!--    <FilterPopover -->
    <!--      :open="openFilter === 'type'" -->
    <!--      label="Type" -->
    <!--      :active="hasActiveTypeFilter" -->
    <!--      :value="typeFilterSummary" -->
    <!--      :apply-disabled="!couponTypeDraft" -->
    <!--      @update:open="updateOpenFilter('type', $event)" -->
    <!--      @apply="applyTypeFilter" -->
    <!--      @clear="clearTypeFilter" -->
    <!--    > -->
    <!--      <USelectMenu -->
    <!--        v-model="couponTypeDraft" -->
    <!--        :options="couponTypeOptions" -->
    <!--        value-attribute="value" -->
    <!--        option-attribute="label" -->
    <!--        placeholder="Select coupon type" -->
    <!--      /> -->
    <!--    </FilterPopover> -->

    <UButton
      v-if="hasActiveFilters"
      color="gray"
      variant="ghost"
      class="h-8 rounded-full px-3 text-xs font-semibold"
      @click="clearAllFilters"
    >
      Clear filters
    </UButton>
  </FilterToolbar>
</template>
