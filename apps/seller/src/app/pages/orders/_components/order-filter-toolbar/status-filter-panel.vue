<script lang="ts" setup>
import type { FilterOption } from '~/app/components/filter/types'

const props = defineProps<{
  options: FilterOption[]
}>()

const model = defineModel<string[]>({ default: () => [] })

function isChecked(value: string) {
  return model.value.includes(value)
}

function toggleValue(value: string, checked: boolean | 'indeterminate') {
  if (checked === 'indeterminate') {
    return
  }

  if (checked) {
    model.value = [...new Set([...model.value, value])]
    return
  }

  model.value = model.value.filter(item => item !== value)
}
</script>

<template>
  <div class="grid">
    <label
      v-for="option in props.options"
      :key="option.value"
      class="flex cursor-pointer items-center gap-3 py-1 text-text-subtle"
    >
      <UCheckbox
        :model-value="isChecked(option.value)"
        @update:model-value="toggleValue(option.value, $event)"
      />
      <span class="text-sm font-medium sm:text-base">
        {{ option.label }}
      </span>
    </label>
  </div>
</template>
