<script setup lang="ts">
import type { ElementType } from '@arc/contracts/utils'
import { formatMinorCurrency } from '@arc/utils'
import type { GetOrderShopsResponse } from '~/domains/me/api/order/contracts/order.contract'

type OrderShop = ElementType<GetOrderShopsResponse['order_shops']>

const props = defineProps<{
  orderShop: OrderShop
}>()

const regularMerchandiseMinor = computed(() => props.orderShop.subtotal_minor + props.orderShop.sale_discount_minor)
const saleDiscountMinor = computed(() => props.orderShop.sale_discount_minor)
const codeDiscountMinor = computed(() => props.orderShop.discount_minor)
const shippingDiscountMinor = computed(() => props.orderShop.shipping_discount_minor ?? 0)

const codeSavingsLabel = computed(() => {
  const codes = props.orderShop.promo_codes.map(promoCode => promoCode.code)
  return codes.length > 0 ? `Code savings (${codes.join(', ')})` : 'Code savings'
})

/** Dividerless card with the header sitting close to its body. */
const cardUi = {
  divide: 'divide-y-0',
  header: { padding: 'px-4 pt-5 pb-0 sm:px-6 sm:pt-6 sm:pb-0' },
  body: { padding: 'px-4 pb-5 pt-2 sm:px-6 sm:pb-6 sm:pt-3' },
}
</script>

<template>
  <UCard :ui="cardUi">
    <template #header>
      <div class="font-medium">
        Order summary
      </div>
    </template>

    <div>
      <div class="flex justify-between gap-4 py-1 text-sm">
        <span>Subtotal</span>
        <span class="text-right">{{ formatMinorCurrency(regularMerchandiseMinor, orderShop.currency) }}</span>
      </div>

      <div
        v-if="saleDiscountMinor > 0"
        class="flex justify-between gap-4 py-1 text-sm"
      >
        <span>Sale savings</span>
        <span class="text-right">−{{ formatMinorCurrency(saleDiscountMinor, orderShop.currency) }}</span>
      </div>

      <div
        v-if="codeDiscountMinor > 0"
        class="flex justify-between gap-4 py-1 text-sm"
      >
        <span>{{ codeSavingsLabel }}</span>
        <span class="text-right">−{{ formatMinorCurrency(codeDiscountMinor, orderShop.currency) }}</span>
      </div>

      <div class="flex justify-between gap-4 py-1 text-sm">
        <span>Shipping</span>
        <span class="text-right">{{ formatMinorCurrency(orderShop.shipping_minor, orderShop.currency) }}</span>
      </div>

      <div
        v-if="shippingDiscountMinor > 0"
        class="flex justify-between gap-4 py-1 text-sm"
      >
        <span>Shipping savings</span>
        <span class="text-right">{{ formatMinorCurrency(shippingDiscountMinor, orderShop.currency) }}</span>
      </div>

      <UDivider class="my-2" />

      <div class="flex justify-between gap-4 py-1 text-sm font-semibold text-text-strong">
        <span>Total</span>
        <span class="text-right">{{ formatMinorCurrency(orderShop.total_minor, orderShop.currency) }}</span>
      </div>
    </div>
  </UCard>
</template>
