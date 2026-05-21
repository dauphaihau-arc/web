<script setup lang="ts">
/*
  use in cart page, cart/checkout page
 */
import type { CartShopGroup } from '~/shared/api/me/cart/cart.shared'

const props = defineProps<{
  shopCart: CartShopGroup
}>()

const options = [
  {
    id: 'benjamincanac',
    label: '341,969₫ (Aug 7-21, Standard Shipping)',
  },
  {
    id: 'benjamincanac',
    label: '743,523₫ (Aug 1-5, Express)',
  },
]

const selected = ref(options[0])

const isSelectAnyProduct = computed(() => {
  return props.shopCart.items.some(prod => prod.is_selected)
})
</script>

<template>
  <div class="flex gap-2 text-lg text-customGray-900">
    <p>Shipping fee:</p>
    <p
      v-if="props.shopCart.total_shipping_fee === 0 && isSelectAnyProduct"
      class="text-right font-normal text-green-700"
    >
      FREE
    </p>
    <p
      v-else-if="props.shopCart.total_shipping_fee > 0"
    >
      {{ convertCurrency(props.shopCart.total_shipping_fee) }}
    </p>
    <p v-else>
      {{ convertCurrency(0) }}
    </p>
  </div>
  <div class="hidden">
    <USelectMenu
      v-model="selected"
      :options="options"
      size="xl"
    />

    <div class="mt-3 text-right text-sm text-zinc-500">
      <p>
        Estimated delivery: Aug 7-21
      </p>
      <p>
        from Slovenia
      </p>
    </div>
  </div>
</template>
