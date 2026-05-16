<script setup lang="ts">
const slots = useSlots()
</script>

<template>
  <UCard
    :ui="{
      base: 'overflow',
      body: {
        padding: ' md:pt-5 md:pb-12',
      },
    }"
  >
    <div class="flex flex-col gap-4">
      <div class="space-y-1">
        <h1
          v-if="slots.title"
          class="text-xl font-semibold"
        >
          <slot name="title" />
        </h1>
        <p
          v-if="slots.subtitle"
          class="text-sm text-customGray-800"
        >
          <slot name="subtitle" />
        </p>
      </div>
      <slot name="content" />
    </div>
  </UCard>
</template>
