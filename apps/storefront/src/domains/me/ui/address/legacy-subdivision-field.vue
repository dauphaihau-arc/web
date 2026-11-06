<script setup lang="ts">
defineProps<{
  value: string
  actionLabel?: string
}>()

const emit = defineEmits<{
  choose: []
}>()
</script>

<template>
  <div class="flex min-h-10 items-center justify-between gap-3 rounded-md border border-gray-200 px-3 py-2">
    <span class="text-sm text-gray-900">{{ value }}</span>
    <UButton
      v-if="actionLabel"
      :padded="false"
      variant="link"
      size="sm"
      @click="emit('choose')"
    >
      {{ actionLabel }}
    </UButton>
  </div>
</template>
