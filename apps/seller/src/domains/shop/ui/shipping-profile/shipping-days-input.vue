<script setup lang="ts">
const props = withDefaults(defineProps<{
  /** Accessible name: the two day boxes share one field row. */
  label: string
  id?: string
  modelValue?: number
  min?: number
  max?: number
  disabled?: boolean
}>(), {
  id: undefined,
  modelValue: undefined,
  min: 0,
  max: undefined,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

/**
 * Whole calendar days only. The box owns its text so a cleared field stays
 * empty and emits nothing: `v-model.number` would hand the form an empty
 * string, which the schema reports as a type error even though an absent range
 * is a valid draft state.
 */
const text = ref(props.modelValue === undefined ? '' : String(props.modelValue))

watch(() => props.modelValue, (value) => {
  const parsed = text.value === '' ? undefined : Number(text.value)

  if (parsed !== value) {
    text.value = value === undefined ? '' : String(value)
  }
})

/**
 * Keep only the leading run of digits, so a negative sign, a decimal point, or
 * a pasted `1.5` can never become a negative or fractional day count, and drop
 * leading zeros so `03` never renders.
 */
function onInput(event: Event) {
  const input = event.target as HTMLInputElement
  const digits = (/^\d*/.exec(input.value.trim())?.[0] ?? '').replace(/^0+(?=\d)/, '')

  text.value = digits
  input.value = digits
  emit('update:modelValue', digits === '' ? undefined : Number(digits))
}

/** Clamp on blur so a value outside the allowed range is corrected, not kept. */
function onBlur() {
  if (text.value === '') {
    return
  }

  const value = Number(text.value)
  const clamped = Math.min(Math.max(value, props.min), props.max ?? Number.POSITIVE_INFINITY)

  text.value = String(clamped)

  if (clamped !== value) {
    emit('update:modelValue', clamped)
  }
}
</script>

<template>
  <UInput
    :id="id"
    :model-value="text"
    type="text"
    inputmode="numeric"
    autocomplete="off"
    :aria-label="label"
    :disabled="disabled"
    size="lg"
    @input="onInput"
    @blur="onBlur"
  />
</template>
