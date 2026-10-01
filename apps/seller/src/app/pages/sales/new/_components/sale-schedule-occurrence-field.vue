<script setup lang="ts">
import { SALE_OCCURRENCE_OPTIONS } from './create-sale-form.constants'

defineProps<{
  /** The field this resolves, used as the select's accessible name. */
  label: string
}>()

const occurrence = defineModel<'earlier' | 'later' | undefined>()
</script>

<template>
  <div class="mt-2 space-y-2">
    <p class="text-sm text-text-muted">
      This local time occurs twice. Choose which occurrence to use.
    </p>
    <USelectMenu
      v-model="occurrence"
      :options="SALE_OCCURRENCE_OPTIONS"
      value-attribute="value"
      name-attribute="label"
      size="lg"
      class="w-80"
      :aria-label="label"
    />
  </div>
</template>
