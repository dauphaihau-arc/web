<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import type { CartShopGroup } from '~/shared/api/cart/cart.shared'

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
  <div>
    <div class="flex gap-2 text-lg text-text-strong">
      <p>Shipping fee:</p>
      <p
        v-if="props.shopCart.shipping_minor === 0 && isSelectAnyProduct"
        class="text-right font-normal text-primary"
      >
        FREE
      </p>
      <p
        v-else-if="props.shopCart.shipping_minor > 0"
      >
        {{ formatMinorCurrency(props.shopCart.shipping_minor, props.shopCart.currency) }}
      </p>
      <p v-else>
        {{ formatMinorCurrency(0, props.shopCart.currency) }}
      </p>
    </div>
    <div class="hidden">
      <USelectMenu
        v-model="selected"
        :options="options"
        size="xl"
      />

      <div class="mt-3 text-right text-sm text-text-muted">
        <p>
          Estimated delivery: Aug 7-21
        </p>
        <p>
          from Slovenia
        </p>
      </div>
    </div>
  </div>
</template>
