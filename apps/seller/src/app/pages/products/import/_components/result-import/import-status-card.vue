<script lang="ts" setup>
import type { ShopProductImportResponse } from '~/domains/shop/api/product/contracts/import.contract'
import { routes } from '~/shared/navigation/routes'

defineProps<{
  importResult: ShopProductImportResponse
  isDownloadingReport: boolean
  progressLabel: string
  progressValue: number
}>()

defineEmits<{
  downloadReport: []
  resetImport: []
}>()
</script>

<template>
  <div class="rounded-lg border border-border-subtle bg-surface p-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-sm font-semibold text-text-strong">
          Import {{ importResult.status }}
        </h2>
        <p class="text-xs text-text-muted">
          {{ progressLabel }}
        </p>
      </div>

      <div class="flex gap-2">
        <UButton
          v-if="importResult.status === 'completed' || importResult.status === 'failed'"
          color="gray"
          :loading="isDownloadingReport"
          @click="$emit('downloadReport')"
        >
          Download report
        </UButton>
        <UButton
          v-if="importResult.status === 'completed'"
          :to="routes.products()"
        >
          View products
        </UButton>
        <UButton
          v-if="importResult.status === 'completed' || importResult.status === 'failed'"
          color="gray"
          @click="$emit('resetImport')"
        >
          Import another
        </UButton>
      </div>
    </div>

    <UProgress
      v-if="importResult.status === 'queued' || importResult.status === 'processing'"
      class="mt-4"
      :value="progressValue"
    />

    <div class="mt-4 grid gap-3 text-sm sm:grid-cols-4">
      <div class="rounded-md bg-surface-muted p-3">
        <p class="text-xs text-text-muted">
          Total
        </p>
        <p class="font-semibold text-text-strong">
          {{ importResult.total_rows }}
        </p>
      </div>
      <div class="rounded-md bg-state-success-surface p-3">
        <p class="text-xs text-state-success-text">
          Created
        </p>
        <p class="font-semibold text-state-success-text">
          {{ importResult.created_rows }}
        </p>
      </div>
      <div class="rounded-md bg-state-danger-surface p-3">
        <p class="text-xs text-state-danger-text">
          Failed
        </p>
        <p class="font-semibold text-state-danger-text">
          {{ importResult.failed_rows }}
        </p>
      </div>
      <div class="rounded-md bg-surface-muted p-3">
        <p class="text-xs text-text-muted">
          Unprocessed
        </p>
        <p class="font-semibold text-text-strong">
          {{ importResult.unprocessed_rows }}
        </p>
      </div>
    </div>

    <UAlert
      v-if="importResult.status === 'failed'"
      class="mt-4"
      color="red"
      variant="soft"
      title="Import failed"
      :description="importResult.error_message ?? 'Download the report for available row results.'"
    />
  </div>
</template>
