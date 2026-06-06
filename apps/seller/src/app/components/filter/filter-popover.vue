<script lang="ts" setup>
import FilterChip from './filter-chip.vue'

const props = withDefaults(defineProps<{
  label: string
  active?: boolean
  value?: string
  applyDisabled?: boolean
  panelClass?: string
  panelPaddingClass?: string
}>(), {
  active: false,
  value: undefined,
  applyDisabled: false,
  panelClass: '',
  panelPaddingClass: 'p-4 sm:p-4',
})

const emit = defineEmits<{
  apply: []
  clear: []
}>()
const isOpen = defineModel<boolean>('open', { default: false })

function handleApply(close: () => void) {
  emit('apply')
  close()
}

function handleTriggerClick() {
  isOpen.value = !isOpen.value
}
</script>

<template>
  <UPopover
    v-model:open="isOpen"
    :popper="{ placement: 'bottom-start' }"
    :ui="{ base: 'overflow-visible rounded-dialog border border-border-subtle bg-surface shadow-overlay' }"
  >
    <div @click.stop.prevent="handleTriggerClick">
      <FilterChip
        :label="props.label"
        :active="props.active"
        :value="props.value"
        @clear="$emit('clear')"
      />
    </div>

    <template #panel="{ close }">
      <div :class="['w-[min(92vw,360px)] rounded-dialog bg-surface', props.panelPaddingClass, props.panelClass]">
        <div class="text-base font-semibold tracking-tight text-text-strong sm:text-lg">
          Filter by: {{ props.label.toLowerCase() }}
        </div>

        <div class="mt-4">
          <slot />
        </div>

        <UButton
          block
          size="md"
          :disabled="props.applyDisabled"
          class="mt-4 text-sm"
          @click="handleApply(close)"
        >
          Apply
        </UButton>
      </div>
    </template>
  </UPopover>
</template>
