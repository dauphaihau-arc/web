<script setup lang="ts">
import type { CountryCode } from 'libphonenumber-js'
import { getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js'
import { computed, ref, watch } from 'vue'
import { toCountryFlag } from '~/domains/location/utils/country-flag'

/**
 * International phone entry: the selected address country supplies the dial
 * code shown in the leading slot, so the buyer types the national number while
 * the model holds a callable E.164 value (`+14155552671`). A value that already
 * starts with `+` is kept exactly as typed for pasted international numbers,
 * and an untouched legacy value is never rewritten.
 */
const props = defineProps<{
  modelValue?: string
  countryCode?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const countryEmoji = computed(() => toCountryFlag(props.countryCode))

const dialCode = computed(() => {
  const countryCode = props.countryCode?.trim().toUpperCase()

  if (!countryCode) {
    return undefined
  }

  try {
    return `+${getCountryCallingCode(countryCode as CountryCode)}`
  }
  catch {
    // Legacy/inactive country codes may not exist in the library; the number
    // is then left exactly as entered.
    return undefined
  }
})

// Nuxt UI keeps its default leading-padding classes in node_modules, which
// this app's Tailwind content does not scan. Use an inline style on the input
// so the reserved space for the dial code does not depend on generated CSS.
const inputStyle = computed(() => {
  if (!dialCode.value) {
    return undefined
  }

  // Reserve room for the flag emoji plus the dial code. Four-character dial
  // codes need a little more room than three-character ones.
  return {
    paddingInlineStart: dialCode.value.length >= 4 ? '4.75rem' : '4.5rem',
  }
})

function toNational(value: string | undefined) {
  const currentDialCode = dialCode.value

  if (currentDialCode && value?.startsWith(currentDialCode)) {
    return value.slice(currentDialCode.length).trim()
  }

  return value ?? ''
}

// While the buyer is typing, keep their exact formatting (spaces, hyphens,
// parentheses) on screen; the canonical value still flows through the model.
const isEditing = ref(false)
const text = ref(toNational(props.modelValue))

watch(
  () => props.modelValue,
  (value) => {
    if (!isEditing.value) {
      text.value = toNational(value)
    }
  },
)

watch(dialCode, () => {
  if (!isEditing.value) {
    text.value = toNational(props.modelValue)
  }
})

function onUserInput(value: string | number) {
  text.value = String(value ?? '')

  const raw = String(value ?? '')
  const trimmed = raw.trim()

  if (trimmed.startsWith('+')) {
    emit('update:modelValue', trimmed)
    return
  }

  const currentDialCode = dialCode.value

  if (!currentDialCode) {
    emit('update:modelValue', raw)
    return
  }

  const nationalDigits = raw.replace(/\D/g, '')

  if (!nationalDigits) {
    emit('update:modelValue', '')
    return
  }

  const countryCode = props.countryCode?.trim().toUpperCase()

  const parsed = countryCode
    ? parsePhoneNumberFromString(raw, countryCode as CountryCode)
    : undefined

  // libphonenumber drops national trunk prefixes (`020…` → `+4420…`) and
  // supplies the correct E.164 shape; partial input falls back to the dial code.
  emit('update:modelValue', parsed?.number ?? `${currentDialCode}${nationalDigits}`)
}

function onFocus() {
  isEditing.value = true
}

function onBlur() {
  isEditing.value = false
  text.value = toNational(props.modelValue)
}
</script>

<template>
  <UInput
    :model-value="text"
    type="tel"
    inputmode="tel"
    autocomplete="tel"
    :style="inputStyle"
    @update:model-value="onUserInput"
    @focus="onFocus"
    @blur="onBlur"
  >
    <template
      v-if="dialCode"
      #leading
    >
      <span class="inline-flex items-center gap-1.5 text-sm text-text-muted">
        <span>{{ countryEmoji }}</span>
        <span>{{ dialCode }}</span>
      </span>
    </template>
  </UInput>
</template>
