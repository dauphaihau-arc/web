<script setup lang="ts">
import StatusBadge from './status-badge.vue'

const props = withDefaults(defineProps<{
  title: string
  description?: string
  badge?: string
  headingClass?: string
}>(), {
  headingClass: 'text-2xl font-medium text-text-strong',
})

const slots = useSlots()
</script>

<template>
  <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <h1 :class="props.headingClass">
        {{ title }}
      </h1>
      <p
        v-if="description"
        class="text-sm text-text-muted"
      >
        {{ description }}
      </p>
    </div>

    <div
      v-if="badge || slots.badge || slots.actions"
      class="flex flex-wrap items-center gap-3"
    >
      <slot name="badge">
        <StatusBadge
          v-if="badge"
          color="gray"
          size="sm"
          :label="badge"
        >
          {{ badge }}
        </StatusBadge>
      </slot>

      <slot name="actions" />
    </div>
  </div>
</template>
