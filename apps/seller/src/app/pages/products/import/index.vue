<script lang="ts" setup>
import ImportFile from './_components/import-file/import-file.vue'
import ResultImport from './_components/result-import/result-import.vue'
import ReviewImport from './_components/review-import/review-import.vue'
import { useProductImport } from './use-product-import'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import { routes } from '~/shared/navigation/routes'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

type ImportStep = 'import-file' | 'review-import' | 'result'

const {
  activeImport,
  canStartImport,
  detectedRowCount,
  downloadReport,
  downloadTemplate,
  hasInvalidPreviewRows,
  invalidPreviewRowCount,
  isDownloadingReport,
  isDownloadingTemplate,
  isParsing,
  isUploading,
  previewRows,
  progressLabel,
  progressValue,
  resetImport: resetProductImport,
  selectedFile,
  selectFile,
  startImport,
  validationErrors,
} = useProductImport()

const currentStep = ref<ImportStep>('import-file')

async function handleSelectFile(file: File) {
  await selectFile(file)

  if (validationErrors.value.length === 0) {
    currentStep.value = 'review-import'
  }
}

function handleBackToImportFile() {
  resetProductImport()
  currentStep.value = 'import-file'
}

async function handleStartImport() {
  await startImport()

  if (activeImport.value) {
    currentStep.value = 'result'
  }
}

function handleResetImport() {
  resetProductImport()
  currentStep.value = 'import-file'
}
</script>

<template>
  <LayoutShopWrapperContent
    back-label="Products"
    :back-to="routes.products()"
  >
    <template #title>
      Import Products
    </template>
    <template #content>
      <div class="mb-20 space-y-6">
        <ImportFile
          v-if="currentStep === 'import-file'"
          :is-downloading-template="isDownloadingTemplate"
          :is-parsing="isParsing"
          :selected-file="selectedFile"
          :validation-errors="validationErrors"
          @download-template="downloadTemplate"
          @select-file="handleSelectFile"
        />

        <ReviewImport
          v-else-if="currentStep === 'review-import' && selectedFile"
          :can-start-import="canStartImport"
          :detected-row-count="detectedRowCount"
          :has-invalid-preview-rows="hasInvalidPreviewRows"
          :invalid-preview-row-count="invalidPreviewRowCount"
          :is-uploading="isUploading"
          :rows="previewRows"
          :selected-file="selectedFile"
          @back="handleBackToImportFile"
          @start-import="handleStartImport"
        />

        <ResultImport
          v-else-if="currentStep === 'result' && activeImport"
          :import-result="activeImport"
          :is-downloading-report="isDownloadingReport"
          :progress-label="progressLabel"
          :progress-value="progressValue"
          @download-report="downloadReport"
          @reset-import="handleResetImport"
        />
      </div>
    </template>
  </LayoutShopWrapperContent>
</template>
