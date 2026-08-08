<script lang="ts" setup>
const props = defineProps<{
  detectedRowCount: number
  selectedFile: File
}>()

const formattedFileSize = computed(() => {
  const sizeInMb = props.selectedFile.size / 1024 / 1024

  if (sizeInMb >= 1) {
    return `${sizeInMb.toFixed(1)} MB`
  }

  return `${Math.max(Math.round(props.selectedFile.size / 1024), 1)} KB`
})

const formattedRowCount = computed(() =>
  new Intl.NumberFormat().format(props.detectedRowCount),
)
</script>

<template>
  <div class="rounded-lg border border-border-subtle bg-surface p-4">
    <h2 class="text-sm font-semibold text-text-strong">
      Review import
    </h2>

    <dl class="mt-4 space-y-3 text-sm">
      <div class="flex flex-wrap gap-x-2 gap-y-1">
        <dt class="text-text-muted">
          File:
        </dt>
        <dd class="font-medium text-text-strong">
          {{ selectedFile.name }}
        </dd>
      </div>

      <div class="flex flex-wrap gap-x-2 gap-y-1">
        <dt class="text-text-muted">
          Size:
        </dt>
        <dd class="font-medium text-text-strong">
          {{ formattedFileSize }}
        </dd>
      </div>

      <div class="flex items-center gap-2 text-state-success-text">
        <UIcon
          name="i-heroicons-check-circle"
          class="size-4 shrink-0"
        />
        <span class="font-medium">
          {{ formattedRowCount }} rows detected
        </span>
      </div>
    </dl>
  </div>
</template>
