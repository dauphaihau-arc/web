<script lang="ts" setup>
const props = defineProps<{
  isParsing: boolean
  selectedFile: File | null
}>()

const emit = defineEmits<{
  selectFile: [file: File]
}>()

const fileInput = ref<HTMLInputElement | null>(null)

watch(() => props.selectedFile, (file) => {
  if (file || !fileInput.value) {
    return
  }

  fileInput.value.value = ''
})

function openFilePicker() {
  if (props.isParsing) {
    return
  }

  fileInput.value?.click()
}

function handleFileInput(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (file) {
    emit('selectFile', file)
  }
}

function handleDrop(event: DragEvent) {
  const file = event.dataTransfer?.files?.[0]

  if (file) {
    emit('selectFile', file)
  }
}
</script>

<template>
  <div
    class="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border-muted bg-surface px-6 py-10 text-center transition-colors hover:border-border-hover hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-hover"
    role="button"
    tabindex="0"
    @click="openFilePicker"
    @dragover.prevent
    @drop.prevent="handleDrop"
    @keydown.enter.prevent="openFilePicker"
    @keydown.space.prevent="openFilePicker"
  >
    <input
      ref="fileInput"
      type="file"
      accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      class="hidden"
      @change="handleFileInput"
      @click.stop
    />
    <div class="mb-4 flex size-12 items-center justify-center rounded-full bg-surface-muted text-text-muted">
      <UIcon
        name="i-heroicons-document-arrow-up"
        class="size-6"
      />
    </div>
    <p class="text-sm font-medium text-text-muted">
      <template v-if="selectedFile">
        {{ selectedFile.name }}
      </template>
      <template v-else>
        Drag and drop your file here, or <span class="text-text-strong">click to select</span>.
      </template>
    </p>
    <p class="mt-1 text-sm text-text-muted">
      {{ selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : 'XLSX (max. 10MB)' }}
    </p>
  </div>
</template>
