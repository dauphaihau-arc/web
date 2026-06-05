<script lang="ts" setup>
import dayjs from 'dayjs'
import type { OrderDateFilterDraft } from './order-filter.types'

const model = defineModel<OrderDateFilterDraft>({ required: true })

const operatorOptions = [
  { label: 'is in the last', value: 'in_last' },
  { label: 'is equal to', value: 'eq' },
  { label: 'is between', value: 'between' },
  { label: 'is on or after', value: 'gte' },
  { label: 'is before or on', value: 'lte' },
] as const

const unitOptions = [
  { label: 'days', value: 'days' },
  { label: 'weeks', value: 'weeks' },
  { label: 'months', value: 'months' },
]

const timezoneOptions = [
  { label: 'GMT+8', value: 'gmt+8' },
  { label: 'UTC', value: 'utc' },
] as Array<{ label: string, value: OrderDateFilterDraft['timezone'] }>

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

function formatDateLabel(value: Date | null) {
  if (!value) {
    return 'Select date'
  }

  return dayjs(value).format('MMM D, YYYY')
}

function isChecked(value: OrderDateFilterDraft['timezone']) {
  return model.value.timezone === value
}

function updateTimezone(value: OrderDateFilterDraft['timezone'], checked: boolean | 'indeterminate') {
  if (checked === 'indeterminate') {
    return
  }

  if (checked) {
    model.value.timezone = value
  }
}
</script>

<template>
  <div class="space-y-4">
    <USelectMenu
      v-model="model.operator"
      :options="operatorOptions"
      value-attribute="value"
      option-attribute="label"
      size="lg"
      class="w-full"
    />

    <div
      v-if="showsRelativeInputs"
      class="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <div class="hidden text-3xl text-indigo-500 sm:block">
        <UIcon
          name="i-heroicons-arrow-right-20-solid"
          class="size-8"
        />
      </div>

      <UInput
        v-model="model.amount"
        type="number"
        min="1"
        size="lg"
        placeholder="7"
      />

      <USelectMenu
        v-model="model.unit"
        :options="unitOptions"
        value-attribute="value"
        option-attribute="label"
        size="lg"
        class="sm:w-36"
      />
    </div>

    <div
      v-else-if="showsSingleDate"
      class="space-y-4"
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="hidden text-3xl text-indigo-500 sm:block">
          <UIcon
            name="i-heroicons-arrow-right-20-solid"
            class="size-8"
          />
        </div>

        <UPopover :popper="{ placement: 'bottom-start' }">
          <UButton
            size="lg"
            color="white"
            variant="outline"
            :label="singleDateLabel"
          />

          <template #panel="{ close }">
            <VDatePicker
              v-model="model.date"
              color="indigo"
              mode="date"
              hide-time-header
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
          v-model="model.time"
          type="time"
          step="60"
          size="lg"
          class="sm:w-56"
        />
      </div>

      <label
        v-if="canIncludeTime"
        class="flex items-center gap-3 text-base font-medium text-slate-700"
      >
        <UCheckbox
          v-model="model.includeTime"
          :disabled="!canEnableIncludeTime"
        />
        <span>Include time</span>
      </label>
    </div>

    <div
      v-else-if="showsRangeDates"
      class="space-y-4"
    >
      <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-start">
        <div class="space-y-3">
          <UPopover :popper="{ placement: 'bottom-start' }">
            <UButton
              size="lg"
              color="white"
              variant="outline"
              :label="startDateLabel"
              class="w-full"
            />

            <template #panel="{ close }">
              <VDatePicker
                v-model="model.startDate"
                color="indigo"
                mode="date"
                hide-time-header
                @close="close"
              />
            </template>
          </UPopover>

          <UInput
            v-if="model.includeTime"
            v-model="model.startTime"
            type="time"
            step="60"
            size="lg"
          />
        </div>

        <div class="hidden self-center px-2 text-base text-slate-700 sm:block">
          and
        </div>

        <div class="space-y-3">
          <UPopover :popper="{ placement: 'bottom-start' }">
            <UButton
              size="lg"
              color="white"
              variant="outline"
              :label="endDateLabel"
              class="w-full"
            />

            <template #panel="{ close }">
              <VDatePicker
                v-model="model.endDate"
                color="indigo"
                mode="date"
                hide-time-header
                @close="close"
              />
            </template>
          </UPopover>

          <UInput
            v-if="model.includeTime"
            v-model="model.endTime"
            type="time"
            step="60"
            size="lg"
          />
        </div>
      </div>

      <label class="flex items-center gap-3 text-base font-medium text-slate-700">
        <UCheckbox
          v-model="model.includeTime"
          :disabled="!canEnableIncludeTime"
        />
        <span>Include time</span>
      </label>
    </div>

    <div class="flex flex-col gap-3 pt-1 text-slate-700 sm:flex-row sm:items-center">
      <div class="text-base">
        Time zone:
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <label
          v-for="option in timezoneOptions"
          :key="option.value"
          class="flex cursor-pointer items-center gap-2 py-1 text-sm font-medium text-slate-700 sm:text-base"
        >
          <UCheckbox
            :model-value="isChecked(option.value)"
            @update:model-value="updateTimezone(option.value, $event)"
          />
          <span>{{ option.label }}</span>
        </label>
      </div>
    </div>
  </div>
</template>
