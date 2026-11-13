<script setup lang="ts">
const slots = useSlots()
</script>

<template>
  <UCard>
    <div
      v-if="slots.title || slots.subtitle"
      class="mb-5 space-y-1"
    >
      <h2
        v-if="slots.title"
        class="text-base font-semibold text-text-strong"
      >
        <slot name="title" />
      </h2>
      <p
        v-if="slots.subtitle"
        class="text-sm text-text-subtle"
      >
        <slot name="subtitle" />
      </p>
    </div>

    <div class="divide-y divide-border-subtle">
      <slot />
    </div>
  </UCard>
</template>
