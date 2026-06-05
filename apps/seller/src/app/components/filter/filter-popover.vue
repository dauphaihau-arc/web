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
    :ui="{ base: 'overflow-visible rounded-[28px] border border-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.14)]' }"
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
      <div :class="['w-[min(92vw,360px)] rounded-[28px] bg-white', props.panelPaddingClass, props.panelClass]">
        <div class="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
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
