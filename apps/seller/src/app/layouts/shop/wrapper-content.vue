<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

withDefaults(defineProps<{
  backLabel?: string
  backTo?: RouteLocationRaw
  contentClass?: string
}>(), {
  backLabel: '',
  backTo: undefined,
  contentClass: '',
})

const slots = useSlots()
</script>

<template>
  <div>
    <div class="mb-6 flex justify-between">
      <div>
        <div
          v-if="backLabel || slots.preTitle"
          class="mb-2"
        >
          <UButton
            v-if="backLabel && backTo"
            :to="backTo"
            color="gray"
            variant="ghost"
            class="-ml-3"
          >
            <AppIcon
              name="arrowLeft"
              size="xs"
            />
            {{ backLabel }}
          </UButton>
          <slot
            v-else
            name="preTitle"
          />
        </div>
        <h1 class="text-2xl font-semibold text-text-strong">
          <slot name="title" />
        </h1>
        <p
          v-if="slots.description"
          class="text-sm text-text-subtle"
        >
          <slot name="description" />
        </p>
      </div>
      <slot name="actions" />
    </div>
    <div :class="contentClass">
      <slot name="content" />
    </div>
  </div>
</template>

<style scoped>

</style>
