<script setup lang="ts">
import { PromotionMinOrderType } from '@arc/enums/promotion'
import RadioGroupInput from '@arc/ui/primitives/radio-group-input.vue'
import type { CreatePromoCodeFormState } from '~/domains/shop/schemas/promo-code/create-promo-code-form.schema'
import WrapperFormGroupCard from '~/shared/ui/wrapper-form-group-card.vue'
import { PROMO_CODE_MINIMUM_OPTIONS } from './create-promo-code-form.constants'

defineProps<{
  disabled: boolean
  shopCurrency: string
}>()

const minOrderType = defineModel<CreatePromoCodeFormState['min_order_type']>('minOrderType', { required: true })
const minOrderValue = defineModel<CreatePromoCodeFormState['min_order_value']>('minOrderValue', { required: true })
const minPurchaseQuantity = defineModel<CreatePromoCodeFormState['min_purchase_quantity']>('minPurchaseQuantity', { required: true })
</script>

<template>
  <WrapperFormGroupCard>
    <template #title>
      Minimum requirements
    </template>
    <template #content>
      <div class="space-y-5">
        <UFormGroup
          label="Do buyers need to meet a minimum?"
          name="min_order_type"
          description="A minimum counts only this code’s eligible products, after any sale and before the code’s own discount. Shipping and other products never count toward it."
        >
          <RadioGroupInput
            v-model="minOrderType"
            :options="PROMO_CODE_MINIMUM_OPTIONS"
            :disabled="disabled"
            row
          />
        </UFormGroup>

        <UFormGroup
          v-if="minOrderType === PromotionMinOrderType.ORDER_TOTAL"
          label="Minimum spend"
          name="min_order_value"
          class="grid grid-cols-4 items-center gap-10"
          required
        >
          <UInput
            v-model.number="minOrderValue"
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
          v-if="minOrderType === PromotionMinOrderType.PURCHASE_QUANTITY"
          label="Minimum quantity"
          name="min_purchase_quantity"
          class="grid grid-cols-4 items-center gap-10"
          required
        >
          <UInput
            v-model.number="minPurchaseQuantity"
            v-numeric
            :disabled="disabled"
            type="number"
            size="lg"
            class="w-32"
          >
            <template #trailing>
              <span class="text-xs text-text-muted">items</span>
            </template>
          </UInput>
        </UFormGroup>
      </div>
    </template>
  </WrapperFormGroupCard>
</template>
