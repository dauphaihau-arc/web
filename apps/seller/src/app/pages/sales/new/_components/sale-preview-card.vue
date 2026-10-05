<script setup lang="ts">
import type { PromotionProductScope } from '@arc/enums/promotion'
import WrapperFormGroupCard from '~/shared/ui/wrapper-form-group-card.vue'
import SalePricePreview from './sale-price-preview.vue'

defineProps<{
  percentOff: number
  productScope: PromotionProductScope
  productIds: string[]
}>()
</script>

<template>
  <WrapperFormGroupCard>
    <template #title>
      Preview
    </template>
    <template #subtitle>
      Illustrative regular and sale prices for this percentage. Checkout promo codes are
      excluded, and a better overlapping sale would take precedence over this one.
    </template>
    <template #content>
      <SalePricePreview
        :percent-off="percentOff"
        :product-scope="productScope"
        :product-ids="productIds"
      />
    </template>
  </WrapperFormGroupCard>
</template>
