<script setup lang="ts">
import RadioGroupInput from '@arc/ui/primitives/radio-group-input.vue'
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import {
  exportColumnPresetOptions,
  exportOrderColumns,
} from './export-orders-dialog.constants'
import { useExportOrdersDialog } from './use-export-orders-dialog'
import type { ListShopOrdersRequest } from '~/domains/shop/api/order/contracts/order.contract'

const props = defineProps<{
  filters?: Partial<ListShopOrdersRequest>
}>()

const {
  actions,
  columnPreset,
  customDateRange,
  customDateRangeLabel,
  dateRangeOptions,
  exportDateRange,
  activeExport,
  isCompletingExport,
  isColumnSelected,
  isExportReady,
  progress,
  progressLabel,
  retryDownload,
  selectedColumnLabels,
  timezoneName,
  timezoneOptions,
  toggleColumn,
} = useExportOrdersDialog(props)
</script>

<template>
  <BaseDialog
    :actions="actions"
    width="w-full sm:max-w-xl"
    body-class="min-h-0 flex-1 overflow-y-auto px-6 py-6"
  >
    <div class="space-y-8">
      <div>
        <h1 class="text-2xl font-bold">
          Export orders
        </h1>
      </div>

      <section
        v-if="!activeExport"
        class="space-y-8"
      >
        <div class="space-y-1">
          <h2 class="text-base font-semibold text-text-strong">
            Time zone
          </h2>
          <RadioGroupInput
            v-model="timezoneName"
            :options="timezoneOptions"
            direction="horizontal"
            value-attribute="id"
            option-attribute="label"
            :ui-radio="{
              wrapper: 'mb-0',
              label: 'text-sm font-medium text-text-muted',
            }"
          />
        </div>

        <div class="space-y-1">
          <h2 class="text-base font-semibold text-text-strong">
            Date range
          </h2>
          <RadioGroupInput
            v-model="exportDateRange"
            :options="dateRangeOptions"
            value-attribute="value"
            option-attribute="label"
            :ui="{
              fieldset: 'max-w-xl',
            }"
            :ui-radio="{
              wrapper: 'w-full py-1',
            }"
          >
            <template #label="{ option }">
              <div class="grid w-80 max-w-full grid-cols-[1fr_9rem] gap-3 text-sm font-medium text-text-muted">
                <span>{{ option.label }}</span>
                <span
                  v-if="option.value !== 'custom'"
                  class="text-text-soft"
                >{{ option.summary }}</span>
              </div>
            </template>
          </RadioGroupInput>

          <div
            v-if="exportDateRange === 'custom'"
            class="ml-6"
          >
            <UPopover :popper="{ placement: 'bottom-start' }">
              <UButton
                :icon="ICON_NAME_BY_ALIAS['calendar']"
                color="white"
                variant="outline"
                :label="customDateRangeLabel"
                class="max-w-full font-normal"
              />

              <template #panel>
                <VDatePicker
                  v-model.range="customDateRange"
                  color="indigo"
                  mode="date"
                  :columns="2"
                  hide-time-header
                />
              </template>
            </UPopover>
          </div>
        </div>

        <div class="space-y-1">
          <h2 class="text-base font-semibold text-text-strong">
            Columns
          </h2>
          <USelectMenu
            v-model="columnPreset"
            :options="exportColumnPresetOptions"
            value-attribute="id"
            option-attribute="label"
            class="w-48"
          />

          <p
            v-if="columnPreset === 'default'"
            class="!mt-3 max-w-3xl text-sm leading-6 text-text-muted"
          >
            {{ selectedColumnLabels }}
          </p>

          <div
            v-else
            class="grid grid-cols-1 gap-x-8 gap-y-3 pt-4 sm:grid-cols-2"
          >
            <label
              v-for="column in exportOrderColumns"
              :key="column.id"
              class="flex cursor-pointer items-center gap-3 text-sm font-medium text-text-muted"
            >
              <UCheckbox
                :model-value="isColumnSelected(column.id)"
                @update:model-value="toggleColumn(column.id, $event)"
              />
              <span>{{ column.label }}</span>
            </label>
          </div>
        </div>
      </section>

      <section
        v-else-if="isExportReady"
      >
        <p class=" text-text-strong">
          Your export is ready. If you don't see your file,
          <span
            class="text-primary hover:text-primary-600 focus-visible:ring-primary-500 inline cursor-pointer whitespace-normal text-left align-baseline font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isCompletingExport"
            @click="retryDownload"
          >
            you can try downloading it again.
          </span>
        </p>
      </section>

      <section
        v-else
        class="space-y-2"
      >
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold text-text-strong">
              Generating report...
            </h2>
            <p class="text-sm text-text-muted">
              You may continue using the application. We'll notify you when it's ready.
            </p>
          </div>
          <span class="text-sm font-medium text-text-muted">
            {{ progress }}%
          </span>
        </div>
        <UProgress :value="progress" />
        <p class="text-text-soft text-xs">
          {{ progressLabel }}
        </p>
      </section>
    </div>
  </BaseDialog>
</template>
