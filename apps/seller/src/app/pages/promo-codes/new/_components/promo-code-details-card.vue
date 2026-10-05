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
          description="Buyers won’t see this. It is only for you to track the promo code, and does not need to be unique."
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
          description="This is what shoppers will enter at checkout to get a discount. Letters and numbers only."
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
          description="Choose whether the code reduces eligible prices by a percentage or a fixed amount, or waives the shop's shipping charge."
          class="grid grid-cols-4 gap-10"
          required
        >
          <RadioGroupInput
            v-model="benefitType"
            :options="PROMO_CODE_BENEFIT_OPTIONS"
            :disabled="disabled"
            row
          />
        </UFormGroup>

        <UFormGroup
          v-if="benefitType === PromotionBenefitType.PERCENTAGE"
          label="Percentage off"
          name="percent_off"
          description="Every eligible product’s price after any sale is reduced by this percentage at checkout."
          class="grid grid-cols-4 items-center gap-10"
          required
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
          v-else-if="benefitType === PromotionBenefitType.FIXED_AMOUNT"
          label="Amount off"
          name="amount_off"
          description="The code subtracts this amount once per order from the eligible merchandise total at checkout, never more than that total."
          class="grid grid-cols-4 items-center gap-10"
          required
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

        <UFormGroup
          label="Visibility"
          name="visibility"
          description="Public promo codes can appear in checkout for eligible shoppers. Code-only promo codes are applied only when a shopper enters the code."
          class="grid grid-cols-4 gap-10"
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
