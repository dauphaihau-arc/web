<script lang="ts" setup>
import RadioGroupInput from '@arc/ui/radio-group-input.vue'
import dayjs from 'dayjs'
import type { OrderDateFilterDraft } from './order-filter.types'
import RangeDates from './range-dates.vue'
import RelativeInputs from './relative-inputs.vue'
import SingleDate from './single-date.vue'
import {
  formatTimezoneOptionLabel,
  getDefaultDateFilterTimezone,
  UTC_TIMEZONE,
} from './date-filter-timezone'

const model = defineModel<OrderDateFilterDraft>({ required: true })

const operatorOptions: Array<{ label: string, value: OrderDateFilterDraft['operator'] }> = [
  { label: 'is in the last', value: 'in_last' },
  { label: 'is equal to', value: 'eq' },
  { label: 'is between', value: 'between' },
  { label: 'is on or after', value: 'gte' },
  { label: 'is before or on', value: 'lte' },
]

const unitOptions: Array<{ label: string, value: OrderDateFilterDraft['unit'] }> = [
  { label: 'days', value: 'days' },
  { label: 'weeks', value: 'weeks' },
  { label: 'months', value: 'months' },
]

const localTimezone = ref(getDefaultDateFilterTimezone())
const timezoneOptions = computed<Array<{ label: string, value: OrderDateFilterDraft['timezone'] }>>(() => [
  { label: formatTimezoneOptionLabel(localTimezone.value), value: localTimezone.value },
  { label: UTC_TIMEZONE, value: UTC_TIMEZONE },
])

const showsRelativeInputs = computed(() => model.value.operator === 'in_last')
const showsSingleDate = computed(() => ['eq', 'gte', 'lte'].includes(model.value.operator))
const showsRangeDates = computed(() => model.value.operator === 'between')
const canEnableIncludeTime = computed(() => {
  switch (model.value.operator) {
    case 'between':
      return !!model.value.startDate && !!model.value.endDate
    case 'gte':
    case 'lte':
      return !!model.value.date
    default:
      return false
  }
})

const datePickerPopoverUi = {
  container: 'z-[60] fixed',
}

watch(() => model.value.operator, (operator) => {
  if (operator === 'in_last') {
    model.value.date = null
    model.value.startDate = null
    model.value.endDate = null
    model.value.includeTime = false
    model.value.time = '00:00'
    model.value.startTime = '00:00'
    model.value.endTime = '23:59'
    return
  }

  if (operator === 'between') {
    model.value.date = null
    return
  }

  model.value.startDate = null
  model.value.endDate = null

  if (!canEnableIncludeTime.value) {
    model.value.includeTime = false
  }
}, { immediate: true })

watch(canEnableIncludeTime, (enabled) => {
  if (!enabled) {
    model.value.includeTime = false
  }
})

watch(() => model.value.startDate, (startDate) => {
  if (!startDate || !model.value.endDate) {
    return
  }

  if (dayjs(model.value.endDate).isBefore(startDate, 'day')) {
    model.value.endDate = startDate
  }
})

onMounted(() => {
  const detectedTimezone = getDefaultDateFilterTimezone()
  localTimezone.value = detectedTimezone

  if (!model.value.timezone) {
    model.value.timezone = detectedTimezone
  }
})

function setOperator(value: OrderDateFilterDraft['operator']) {
  model.value.operator = value
}
</script>

<template>
  <div class="space-y-3">
    <USelectMenu
      :model-value="model.operator"
      :options="operatorOptions"
      value-attribute="value"
      option-attribute="label"
      size="lg"
      class="w-full"
      @update:model-value="setOperator"
    />

    <RelativeInputs
      v-if="showsRelativeInputs"
      v-model="model"
      :unit-options="unitOptions"
    />

    <SingleDate
      v-else-if="showsSingleDate"
      v-model="model"
      :date-picker-popover-ui="datePickerPopoverUi"
    />

    <RangeDates
      v-else-if="showsRangeDates"
      v-model="model"
      :date-picker-popover-ui="datePickerPopoverUi"
    />

    <div class="flex items-center gap-3 pt-1 text-text-subtle">
      <div class="shrink-0 whitespace-nowrap text-base">
        Time zone:
      </div>

      <RadioGroupInput
        v-model="model.timezone"
        :options="timezoneOptions"
        direction="horizontal"
        value-attribute="value"
        option-attribute="label"
        :ui="{
          fieldset: 'min-w-0 flex-1',
        }"
        :ui-radio="{
          wrapper: 'mb-0',
          label: 'text-sm font-medium text-text-subtle sm:text-base',
        }"
      />
    </div>
  </div>
</template>
