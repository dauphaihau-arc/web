<script lang="ts" setup>
import type { PublishFeedback } from '../products-table.types'

const props = defineProps<{
  feedback: PublishFeedback
}>()

const emit = defineEmits<{
  dismiss: []
  editFirstFailed: []
}>()

const affectedProductsLabel = computed(() =>
  props.feedback.failedProducts.map(product => product.title).join(', '))
</script>

<template>
  <div class="mb-4 space-y-3">
    <UAlert
      color="amber"
      variant="soft"
      :close-button="{
        icon: 'i-heroicons-x-mark-20-solid', color: 'gray', variant: 'link', padded: false,
      }"
      :title="feedback.title"
      :description="feedback.description"
      @close="emit('dismiss')"
    />

    <div class="rounded-lg border border-state-danger-border bg-state-danger-surface p-4">
      <div class="space-y-2 text-sm text-state-danger-text">
        <p
          v-for="reasonSummary in feedback.reasonSummaries"
          :key="reasonSummary"
        >
          {{ reasonSummary }}
        </p>
      </div>

      <div class="mt-3 text-sm text-state-danger-text">
        <span class="font-medium">Affected products:</span>
        {{ affectedProductsLabel }}
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <UButton
          color="amber"
          variant="soft"
          @click="emit('editFirstFailed')"
        >
          Edit first failed product
        </UButton>
        <UButton
          color="gray"
          variant="ghost"
          @click="emit('dismiss')"
        >
          Dismiss
        </UButton>
      </div>
    </div>
  </div>
</template>
