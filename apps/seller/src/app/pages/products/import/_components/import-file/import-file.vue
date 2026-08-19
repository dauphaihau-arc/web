<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import FileDropzone from './file-dropzone.vue'

defineProps<{
  isDownloadingTemplate: boolean
  isParsing: boolean
  selectedFile: File | null
  validationErrors: string[]
}>()

defineEmits<{
  downloadTemplate: []
  selectFile: [file: File]
}>()
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-sm text-text-muted">
          Upload an XLSX file to create draft products.
        </p>
      </div>
      <UButton
        color="gray"
        :icon="ICON_NAME_BY_ALIAS['downloadTray']"
        :loading="isDownloadingTemplate"
        @click="$emit('downloadTemplate')"
      >
        Download template
      </UButton>
    </div>

    <FileDropzone
      :is-parsing="isParsing"
      :selected-file="selectedFile"
      @select-file="$emit('selectFile', $event)"
    />

    <UAlert
      v-if="validationErrors.length > 0"
      color="red"
      variant="soft"
      title="File needs changes"
      :description="validationErrors.join(' ')"
    />
  </div>
</template>
