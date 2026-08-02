<script lang="ts" setup>
withDefaults(defineProps<{
  title: string
  description?: string
  bodyClass?: string
}>(), {
  description: undefined,
  bodyClass: undefined,
})
</script>

<template>
  <section class="rounded-lg border border-border-subtle bg-surface p-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-base font-semibold text-text-strong">
          {{ title }}
        </h2>
        <p
          v-if="description"
          class="text-sm text-text-subtle"
        >
          {{ description }}
        </p>
      </div>

      <slot name="header-end" />
    </div>

    <div
      class="mt-5"
      :class="bodyClass"
    >
      <slot />
    </div>
  </section>
</template>
