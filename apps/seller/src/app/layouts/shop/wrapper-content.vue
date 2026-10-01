<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

type PageSize = 'wide' | 'form'

const PAGE_SIZE_CLASS: Record<PageSize, string | undefined> = {
  wide: undefined,
  form: 'mx-auto w-full max-w-xl',
}

const props = withDefaults(defineProps<{
  backLabel?: string
  backTo?: RouteLocationRaw
  contentClass?: string
  /**
   * Page width preset. `wide` fills the layout, `form` centers a narrow
   * single-column page (title, description and content together).
   */
  size?: PageSize
}>(), {
  backLabel: '',
  backTo: undefined,
  contentClass: '',
  size: 'wide',
})

const rootClass = computed(() => PAGE_SIZE_CLASS[props.size])

const slots = useSlots()
</script>

<template>
  <div :class="rootClass">
    <div class="mb-6 flex items-start justify-between">
      <div>
        <div
          v-if="backLabel || slots.preTitle"
        >
          <UButton
            v-if="backLabel && backTo"
            :to="backTo"
            variant="ghost"
            class="-ml-3 hover:bg-transparent"
          >
            <AppIcon
              name="chevronLeft"
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
