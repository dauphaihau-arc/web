<script setup lang="ts">
const slots = useSlots()
</script>

<template>
  <UCard
    :ui="{
      body: {
        padding: 'md:px-14 md:py-16',
      },
      shadow: 'shadow-border',
    }"
  >
    <div class="flex flex-col gap-4">
      <div class="space-y-2">
        <h1
          v-if="slots.title"
          class="text-2xl font-bold"
        >
          <slot name="title" />
        </h1>
        <p
          v-if="slots.subtitle"
          class="text-sm text-text-strong"
        >
          <slot name="subtitle" />
        </p>
      </div>
      <slot name="content" />
    </div>
  </UCard>
</template>
