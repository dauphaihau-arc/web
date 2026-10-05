<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import type { CartShopGroup } from '~/domains/cart/api/cart.shared'

const props = defineProps<{
  shopCart: CartShopGroup
}>()

/**
 * The cart is merchandise-only: it carries no server-accepted charge, so the
 * summary shows the shop's merchandise total, any code saving applied to it,
 * and the resulting shop total.
 */
const currency = computed(() => props.shopCart.currency)

const merchandiseTotalMinor = computed(() => props.shopCart.total_minor)

const codeSavingsMinor = computed(() => props.shopCart.discount_minor)

const totalMinor = computed(() => merchandiseTotalMinor.value - codeSavingsMinor.value)
</script>

<template>
  <div>
    <template v-if="codeSavingsMinor > 0">
      <div class="flex justify-between">
        <div class="title">
          <div>Product(s) total</div>
          <div>Code savings</div>
        </div>
        <div class="price">
          <div>
            {{ formatMinorCurrency(merchandiseTotalMinor, currency) }}
          </div>
          <div>
            {{ formatMinorCurrency(codeSavingsMinor, currency) }}
          </div>
        </div>
      </div>
      <UDivider class="my-3" />
    </template>
    <div class="flex justify-between">
      <div class="font-semibold">
        Total
      </div>
      <div class="font-semibold">
        {{ formatMinorCurrency(totalMinor, currency) }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.title {
  @apply font-normal
}

.price {
  @apply text-right
}
</style>
