<script setup lang="ts">
import { ref } from 'vue'
import { PromotionBenefitType } from '@arc/enums/promotion'
import RadioGroupInput from '@arc/ui/primitives/radio-group-input.vue'
import type { CreatePromoCodeFormState } from '~/domains/shop/schemas/promo-code/create-promo-code-form.schema'
import WrapperFormGroupCard from '~/shared/ui/wrapper-form-group-card.vue'
import {
  PROMO_CODE_BENEFIT_OPTIONS,
  PROMO_CODE_CODE_MAX_LENGTH,
  PROMO_CODE_VISIBILITY_OPTIONS,
} from './create-promo-code-form.constants'

defineProps<{
  disabled: boolean
  shopCurrency: string
}>()

const name = defineModel<CreatePromoCodeFormState['name']>('name', { required: true })
const code = defineModel<CreatePromoCodeFormState['code']>('code', { required: true })
const benefitType = defineModel<CreatePromoCodeFormState['benefit_type']>('benefitType', { required: true })
const percentOff = defineModel<CreatePromoCodeFormState['percent_off']>('percentOff', { required: true })
const amountOff = defineModel<CreatePromoCodeFormState['amount_off']>('amountOff', { required: true })
const visibility = defineModel<CreatePromoCodeFormState['visibility']>('visibility', { required: true })

const codeFieldRef = ref<{ $el?: HTMLElement | null } | null>(null)

defineExpose({
  codeElement: () => codeFieldRef.value?.$el ?? null,
})
</script>

<template>
  <WrapperFormGroupCard>
    <template #title>
      Promo code details
    </template>
    <template #content>
      <div class="space-y-5">
        <UFormGroup
          label="Name"
          name="name"
          description="Buyers won’t see this."
          class="grid grid-cols-4 gap-10"
          required
        >
          <UInput
            v-model="name"
            placeholder="Ex. Autumn promo code"
            :disabled="disabled"
            :maxlength="255"
            size="lg"
          />
        </UFormGroup>

        <UFormGroup
          ref="codeFieldRef"
          label="Code"
          name="code"
          description="Shoppers enter this at checkout. Letters and numbers only."
          class="grid grid-cols-4 gap-10"
          required
        >
          <UInput
            v-model="code"
            v-uppercase
            :maxlength="PROMO_CODE_CODE_MAX_LENGTH"
            :disabled="disabled"
            placeholder="Ex. WINTERSALE"
            size="lg"
            class="w-full"
            @keydown.space.prevent
          />
        </UFormGroup>

        <UFormGroup
          label="Discount type"
          name="benefit_type"
          description="How the discount is applied to eligible items."
          class="grid grid-cols-4 gap-10"
          :ui="{ container: 'col-span-3' }"
          required
        >
          <RadioGroupInput
            v-model="benefitType"
            :options="PROMO_CODE_BENEFIT_OPTIONS"
            :disabled="disabled"
            row
            :ui-radio="{ wrapper: '!items-start' }"
          >
            <template #label="{ option }">
              <div
                class="flex flex-col gap-2"
                :class="option.value !== PromotionBenefitType.FREE_SHIPPING && 'min-w-[128px]'"
              >
                <span class="text-sm font-medium text-text-subtle">
                  {{ option.label }}<span
                    v-if="option.value === benefitType && option.value !== PromotionBenefitType.FREE_SHIPPING"
                    class="ms-0.5 text-red-500"
                  >*</span>
                </span>

                <UFormGroup
                  v-if="option.value === benefitType && option.value === PromotionBenefitType.PERCENTAGE"
                  name="percent_off"
                  class="w-32"
                >
                  <UInput
                    v-model.number="percentOff"
                    v-numeric
                    v-max-number="99"
                    :disabled="disabled"
                    type="number"
                    step="any"
                    size="lg"
                    class="w-32"
                  >
                    <template #trailing>
                      <span class="text-xs text-text-muted">%</span>
                    </template>
                  </UInput>
                </UFormGroup>

                <UFormGroup
                  v-else-if="option.value === benefitType && option.value === PromotionBenefitType.FIXED_AMOUNT"
                  name="amount_off"
                  class="w-32"
                >
                  <UInput
                    v-model.number="amountOff"
                    v-numeric
                    :disabled="disabled"
                    type="number"
                    step="any"
                    size="lg"
                    class="w-32"
                  >
                    <template #trailing>
                      <span class="text-xs text-text-muted">{{ shopCurrency }}</span>
                    </template>
                  </UInput>
                </UFormGroup>
              </div>
            </template>
          </RadioGroupInput>
        </UFormGroup>

        <UFormGroup
          label="Visibility"
          name="visibility"
          description="Whether the code is surfaced to shoppers automatically or only when entered."
          class="grid grid-cols-4 gap-10"
          :ui="{ container: 'col-span-3' }"
          required
        >
          <RadioGroupInput
            v-model="visibility"
            :options="PROMO_CODE_VISIBILITY_OPTIONS"
            :disabled="disabled"
            row
          />
        </UFormGroup>
      </div>
    </template>
  </WrapperFormGroupCard>
</template>
