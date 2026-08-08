<script lang="ts" setup>
import type { ProductImportPreviewRow } from '../../product-import-preview'
import InfoImportCard from './info-import-card.vue'
import PreviewTable from './preview-table.vue'

defineProps<{
  canStartImport: boolean
  detectedRowCount: number
  hasInvalidPreviewRows: boolean
  invalidPreviewRowCount: number
  isUploading: boolean
  rows: ProductImportPreviewRow[]
  selectedFile: File
}>()

defineEmits<{
  back: []
  startImport: []
}>()
</script>

<template>
  <div class="space-y-6">
    <InfoImportCard
      :detected-row-count="detectedRowCount"
      :selected-file="selectedFile"
    />

    <UAlert
      v-if="hasInvalidPreviewRows"
      color="red"
      variant="soft"
      title="File needs changes"
      :description="`${invalidPreviewRowCount} preview row${invalidPreviewRowCount === 1 ? '' : 's'} contain invalid values. Fix the XLSX file, then upload it again.`"
    />

    <PreviewTable :rows="rows" />

    <div class="flex flex-wrap items-center justify-between gap-3">
      <UButton
        color="gray"
        @click="$emit('back')"
      >
        Back
      </UButton>

      <UButton
        :disabled="!canStartImport"
        :loading="isUploading"
        @click="$emit('startImport')"
      >
        Start Import
      </UButton>
    </div>
  </div>
</template>
