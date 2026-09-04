<script setup lang="ts">
import type { CurrencyOption } from '@arc/utils/currency-options'
import type { FormSubmitEvent } from '#ui/types'
import type { PreferenceState } from './preference-options'

const props = withDefaults(defineProps<{
  state: PreferenceState
  regionOptions: string[]
  currencyOptions: CurrencyOption[]
  disabled?: boolean
  isPendingMarketConfig?: boolean
  bodyClass?: string
}>(), {
  bodyClass: 'space-y-5',
})

const emit = defineEmits<{
  submit: [event: FormSubmitEvent<PreferenceState>]
}>()

const formRef = ref()
const preferenceState = toRef(props, 'state')

const selectMenuUi = {
  container: 'z-[60]',
}

const currencySelectMenuUi = {
  ...selectMenuUi,
  select: '!normal-case',
  option: { base: '!normal-case' },
}

defineExpose({
  submit: () => formRef.value?.submit(),
})
</script>

<template>
  <UForm
    ref="formRef"
    :state="preferenceState"
    @submit="emit('submit', $event)"
  >
    <div :class="props.bodyClass">
      <UFormGroup
        label="Region"
        name="region"
        required
        class="mb-4"
      >
        <USelectMenu
          v-model="preferenceState.region"
          :disabled="props.disabled || props.isPendingMarketConfig"
          size="xl"
          :options="props.regionOptions"
          :ui-menu="selectMenuUi"
        />
      </UFormGroup>

      <UFormGroup
        label="Currency"
        name="currency"
        required
        class="mb-4"
      >
        <USelectMenu
          v-model="preferenceState.currency"
          data-testid="market-preferences-currency"
          searchable
          size="xl"
          :disabled="props.disabled"
          :options="props.currencyOptions"
          value-attribute="id"
          option-attribute="displayLabel"
          :ui-menu="currencySelectMenuUi"
        />
      </UFormGroup>
    </div>
  </UForm>
</template>
