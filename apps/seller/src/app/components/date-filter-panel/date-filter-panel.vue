<script lang="ts" setup>
import dayjs from 'dayjs'
import { ICON_NAME_BY_ALIAS } from '@arc/ui/app-icon.constants'
import type { OrderDateFilterDraft } from './order-filter.types'
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

const unitOptions = [
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
const canIncludeTime = computed(() => ['between', 'gte', 'lte'].includes(model.value.operator))
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

const singleDateLabel = computed(() => formatDateLabel(model.value.date))
const startDateLabel = computed(() => formatDateLabel(model.value.startDate))
const endDateLabel = computed(() => formatDateLabel(model.value.endDate))
const datePickerPopoverUi = {
  container: 'z-[60] fixed',
}

const startDateDisabledDates = computed(() => {
  if (!model.value.endDate) {
    return undefined
  }

  return [{ start: dayjs(model.value.endDate).add(1, 'day').toDate() }]
})
const endDateDisabledDates = computed(() => {
  if (!model.value.startDate) {
    return undefined
  }

  return [{ end: dayjs(model.value.startDate).subtract(1, 'day').toDate() }]
})

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

  if (!canIncludeTime.value || !canEnableIncludeTime.value) {
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

function formatDateLabel(value: Date | null) {
  if (!value) {
    return 'Select date'
  }

  return dayjs(value).format('MMM D, YYYY')
}

function setOperator(value: OrderDateFilterDraft['operator']) {
  model.value.operator = value
}

function setAmount(value: string | number) {
  model.value.amount = String(value ?? '')
}

function setUnit(value: OrderDateFilterDraft['unit']) {
  model.value.unit = value
}

function setDate(value: Date | null) {
  model.value.date = value
}

function setIncludeTime(value: boolean | 'indeterminate') {
  if (value === 'indeterminate') {
    return
  }

  model.value.includeTime = value
}

function setTime(value: string | number) {
  model.value.time = String(value ?? '')
}

function setStartDate(value: Date | null) {
  model.value.startDate = value
}

function setEndDate(value: Date | null) {
  model.value.endDate = value
}

function setStartTime(value: string | number) {
  model.value.startTime = String(value ?? '')
}

function setEndTime(value: string | number) {
  model.value.endTime = String(value ?? '')
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

    <div
      v-if="showsRelativeInputs"
      class="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <div class="hidden text-3xl text-primary sm:block">
        <UIcon
          name="i-heroicons-arrow-right-20-solid"
          class="size-8"
        />
      </div>

      <UInput
        :model-value="model.amount"
        type="number"
        min="1"
        size="lg"
        placeholder="7"
        @update:model-value="setAmount"
      />

      <USelectMenu
        :model-value="model.unit"
        :options="unitOptions"
        value-attribute="value"
        option-attribute="label"
        size="lg"
        class="sm:w-36"
        @update:model-value="setUnit"
      />
    </div>

    <div
      v-else-if="showsSingleDate"
      class="space-y-3"
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="hidden text-3xl text-primary sm:block">
          <UIcon
            name="i-heroicons-arrow-right-20-solid"
            class="size-8"
          />
        </div>

        <UPopover
          :popper="{ placement: 'bottom-start' }"
          :ui="datePickerPopoverUi"
        >
          <UButton
            size="lg"
            color="white"
            variant="outline"
            :label="singleDateLabel"
          />

          <template #panel="{ close }">
            <VDatePicker
              :model-value="model.date"
              color="indigo"
              mode="date"
              hide-time-header
              @update:model-value="setDate"
              @close="close"
            />
          </template>
        </UPopover>
      </div>

      <div
        v-if="model.includeTime"
        class="flex flex-col gap-3 sm:flex-row sm:items-center sm:pl-12"
      >
        <UInput
          :model-value="model.time"
          type="time"
          step="60"
          size="lg"
          class="sm:w-56"
          @update:model-value="setTime"
        />
      </div>

      <label
        v-if="canIncludeTime"
        class="flex items-center gap-3 text-base font-medium text-text-subtle"
      >
        <UCheckbox
          :model-value="model.includeTime"
          :disabled="!canEnableIncludeTime"
          @update:model-value="setIncludeTime"
        />
        <span>Include time</span>
      </label>
    </div>

    <div
      v-else-if="showsRangeDates"
      class="space-y-4"
    >
      <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-start">
        <div>
          <UPopover
            :popper="{ placement: 'bottom-start' }"
            :ui="datePickerPopoverUi"
          >
            <UButton
              :icon="ICON_NAME_BY_ALIAS['calendar']"
              size="lg"
              color="white"
              variant="outline"
              :label="startDateLabel"
              class="w-full"
            />

            <template #panel="{ close }">
              <VDatePicker
                :model-value="model.startDate"
                color="indigo"
                :disabled-dates="startDateDisabledDates"
                mode="date"
                hide-time-header
                @update:model-value="setStartDate"
                @close="close"
              />
            </template>
          </UPopover>
        </div>

        <div class="hidden self-center px-2 text-base text-text-subtle sm:block">
          to
        </div>

        <div>
          <UPopover
            :popper="{ placement: 'bottom-start' }"
            :ui="datePickerPopoverUi"
          >
            <UButton
              :icon="ICON_NAME_BY_ALIAS['calendar']"
              size="lg"
              color="white"
              variant="outline"
              :label="endDateLabel"
              class="w-full"
            />

            <template #panel="{ close }">
              <VDatePicker
                :model-value="model.endDate"
                color="indigo"
                :disabled-dates="endDateDisabledDates"
                mode="date"
                hide-time-header
                @update:model-value="setEndDate"
                @close="close"
              />
            </template>
          </UPopover>
        </div>

        <UInput
          v-if="model.includeTime"
          :model-value="model.startTime"
          type="time"
          step="60"
          size="lg"
          class="sm:col-start-1"
          @update:model-value="setStartTime"
        />

        <div
          v-if="model.includeTime"
          class="hidden sm:block"
        />

        <UInput
          v-if="model.includeTime"
          :model-value="model.endTime"
          type="time"
          step="60"
          size="lg"
          class="sm:col-start-3"
          @update:model-value="setEndTime"
        />
      </div>

      <label class="flex items-center gap-2 text-base font-medium text-text-subtle">
        <UCheckbox
          :model-value="model.includeTime"
          :disabled="!canEnableIncludeTime"
          @update:model-value="setIncludeTime"
        />
        <span>Include time</span>
      </label>
    </div>

    <div class="flex items-center gap-3 pt-1 text-text-subtle">
      <div class="shrink-0 whitespace-nowrap text-base">
        Time zone:
      </div>

      <RadioGroup
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
