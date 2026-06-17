<script lang="ts" setup>
import dayjs from 'dayjs'
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import type { OrderDateFilterDraft } from './order-filter.types'

const model = defineModel<OrderDateFilterDraft>({ required: true })

defineProps<{
  datePickerPopoverUi: { container: string }
}>()

const canIncludeTime = computed(() => ['gte', 'lte'].includes(model.value.operator))
const canEnableIncludeTime = computed(() => !!model.value.date)
const singleDateLabel = computed(() => formatDateLabel(model.value.date))

function formatDateLabel(value: Date | null) {
  if (!value) {
    return 'Select date'
  }

  return dayjs(value).format('MMM D, YYYY')
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
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div class="hidden text-primary sm:block">
        <AppIcon
          name="arrowForward"
          class="size-7"
        />
      </div>

      <UPopover
        :popper="{ placement: 'bottom-start' }"
        :ui="datePickerPopoverUi"
      >
        <UButton
          :icon="ICON_NAME_BY_ALIAS['calendar']"
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
</template>
