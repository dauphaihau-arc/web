<script setup lang="ts">
defineProps<{
  rows: {
    orderItemId: string
    title: string
    hint: string
    max: number
  }[]
}>()

const quantities = defineModel<Record<string, number>>({ required: true })
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="row in rows"
      :key="row.orderItemId"
      class="flex items-center justify-between gap-4"
    >
      <div class="min-w-0">
        <div class="truncate text-sm text-text-strong">
          {{ row.title }}
        </div>
        <div class="text-xs text-text-muted">
          {{ row.hint }}
        </div>
      </div>
      <UInput
        v-model.number="quantities[row.orderItemId]"
        type="number"
        :min="0"
        :max="row.max"
        :disabled="row.max === 0"
        class="w-24"
        size="sm"
      />
    </div>
  </div>
</template>
