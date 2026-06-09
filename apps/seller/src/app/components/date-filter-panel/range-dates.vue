<script lang="ts" setup>
import dayjs from 'dayjs'
import { ICON_NAME_BY_ALIAS } from '@arc/ui/app-icon.constants'
import type { OrderDateFilterDraft } from './order-filter.types'

const model = defineModel<OrderDateFilterDraft>({ required: true })

defineProps<{
  datePickerPopoverUi: { container: string }
}>()

const canEnableIncludeTime = computed(() => !!model.value.startDate && !!model.value.endDate)
const startDateLabel = computed(() => formatDateLabel(model.value.startDate))
const endDateLabel = computed(() => formatDateLabel(model.value.endDate))
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

function formatDateLabel(value: Date | null) {
  if (!value) {
    return 'Select date'
  }

  return dayjs(value).format('MMM D, YYYY')
}

function setStartDate(value: Date | null) {
  model.value.startDate = value
}

function setEndDate(value: Date | null) {
  model.value.endDate = value
}

function setIncludeTime(value: boolean | 'indeterminate') {
  if (value === 'indeterminate') {
    return
  }

  model.value.includeTime = value
}

function setStartTime(value: string | number) {
  model.value.startTime = String(value ?? '')
}

function setEndTime(value: string | number) {
  model.value.endTime = String(value ?? '')
}
</script>

<template>
  <div class="space-y-4">
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
</template>
