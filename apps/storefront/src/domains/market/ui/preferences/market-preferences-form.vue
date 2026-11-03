<script setup lang="ts">
import type { CurrencyOption } from '@arc/utils/currency-options'
import type { FormSubmitEvent } from '#ui/types'
import type { PreferenceState } from './preference-options'
import MarketCurrencySelect from './market-currency-select.vue'
import MarketRegionSelect from './market-region-select.vue'

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
        <MarketRegionSelect
          v-model="preferenceState.region"
          :disabled="props.disabled"
          :pending="props.isPendingMarketConfig"
          :options="props.regionOptions"
        />
      </UFormGroup>

      <UFormGroup
        label="Currency"
        name="currency"
        required
        class="mb-4"
      >
        <MarketCurrencySelect
          v-model="preferenceState.currency"
          data-testid="market-preferences-currency"
          :disabled="props.disabled"
          :options="props.currencyOptions"
        />
      </UFormGroup>
    </div>
  </UForm>
</template>
