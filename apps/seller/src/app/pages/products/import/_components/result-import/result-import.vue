<script lang="ts" setup>
import ImportStatusCard from './import-status-card.vue'
import type { ShopProductImportResponse } from '~/domains/shop/api/product/contracts/import.contract'

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
  <ImportStatusCard
    :import-result="importResult"
    :is-downloading-report="isDownloadingReport"
    :progress-label="progressLabel"
    :progress-value="progressValue"
    @download-report="$emit('downloadReport')"
    @reset-import="$emit('resetImport')"
  />
</template>
