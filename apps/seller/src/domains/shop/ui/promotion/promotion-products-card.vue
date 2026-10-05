<script setup lang="ts">
import { PromotionProductScope } from '@arc/enums/promotion'
import RadioGroupInput from '@arc/ui/primitives/radio-group-input.vue'
import ApplyProductTargets from '~/domains/shop/ui/apply-product-targets.vue'
import WrapperFormGroupCard from '~/shared/ui/wrapper-form-group-card.vue'
import { PROMOTION_PRODUCT_SCOPE_OPTIONS } from './promotion.constants'

defineProps<{
  /** How this form asks for its Product Scope, which differs between forms. */
  question: string
  disabled: boolean
}>()

const productScope = defineModel<PromotionProductScope>('productScope', { required: true })
const productIds = defineModel<string[]>('productIds', { required: true })
</script>

<template>
  <WrapperFormGroupCard>
    <template #title>
      Products
    </template>
    <template #content>
      <div class="space-y-5">
        <UFormGroup
          :label="question"
          name="product_scope"
          description="Selecting a product includes every one of its purchasable variants."
        >
          <RadioGroupInput
            v-model="productScope"
            :options="PROMOTION_PRODUCT_SCOPE_OPTIONS"
            :disabled="disabled"
            row
          />
        </UFormGroup>

        <UFormGroup
          v-if="productScope === PromotionProductScope.SPECIFIC"
          name="product_ids"
        >
          <ApplyProductTargets v-model="productIds" />
        </UFormGroup>
      </div>
    </template>
  </WrapperFormGroupCard>
</template>
