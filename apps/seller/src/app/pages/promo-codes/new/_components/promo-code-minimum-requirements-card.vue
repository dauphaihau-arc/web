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
          description="Applies to this code’s eligible products only, counted after sales and before the code’s discount."
          class="grid grid-cols-4 gap-10"
          :ui="{ container: 'col-span-3' }"
        >
          <RadioGroupInput
            v-model="minOrderType"
            :options="PROMO_CODE_MINIMUM_OPTIONS"
            :disabled="disabled"
            row
            :ui-radio="{ wrapper: '!items-start' }"
          >
            <template #label="{ option }">
              <div
                class="flex flex-col gap-2"
                :class="option.value !== PromotionMinOrderType.NONE && 'min-w-[128px]'"
              >
                <span class="text-sm font-medium text-text-subtle">
                  {{ option.label }}<span
                    v-if="option.value === minOrderType && option.value !== PromotionMinOrderType.NONE"
                    class="ms-1 text-red-500"
                  >*</span>
                </span>

                <UFormGroup
                  v-if="option.value === minOrderType && option.value === PromotionMinOrderType.ORDER_TOTAL"
                  name="min_order_value"
                  class="w-32"
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
                  v-else-if="option.value === minOrderType && option.value === PromotionMinOrderType.PURCHASE_QUANTITY"
                  name="min_purchase_quantity"
                  class="w-32"
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
          </RadioGroupInput>
        </UFormGroup>
      </div>
    </template>
  </WrapperFormGroupCard>
</template>
