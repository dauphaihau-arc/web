<script setup lang="ts">
import type { ElementType } from '~/shared/contracts/utils'
import type { GetOrderShopsResponse } from '~/shared/api/me/order/get-order-shops'
import { PaymentTypes } from '~/shared/config/enums/order'

defineProps<{
  orderShop: ElementType<GetOrderShopsResponse['order_shops']>
}>()

const showMore = ref(false)
</script>

<template>
  <div>
    <UButton
      color="gray"
      class="-ml-2.5 mb-2"
      variant="ghost"
      :trailing-icon="showMore ? 'i-material-symbols:keyboard-arrow-up' : 'i-material-symbols:keyboard-arrow-down'"
      @click="showMore = !showMore"
    >
      Show {{ showMore ? 'less':'more' }}
    </UButton>

    <div
      v-if="showMore"
      class="flex justify-between"
    >
      <div
        v-if="orderShop?.payment"
        class="space-y-1.5"
      >
        <div class="font-bold">
          Payment Method
        </div>
        <div
          v-if="orderShop?.payment?.type === PaymentTypes.CARD"
          class="space-y-0.5"
        >
          <div class="first-letter:capitalize">
            {{ orderShop?.payment?.card_brand }} ending in {{ orderShop?.payment?.card_last4 }}
          </div>
          <div class="text-zinc-500/80">
            Your {{ orderShop.payment.card_funding ?? '' }} card information was not shared with this shop
          </div>
        </div>
        <div v-else-if="orderShop.payment.type === PaymentTypes.CASH">
          Cash
        </div>
      </div>

      <div class="w-1/3">
        <div class="flex justify-between">
          <div class="title">
            <div>Product(s) total</div>
            <div>Shop discount</div>
          </div>
          <div class="price">
            <div>
              {{ convertCurrency(orderShop.subtotal) }}
            </div>
            <div>
              {{ convertCurrency(orderShop.total_discount) }}
            </div>
          </div>
        </div>
        <UDivider class="my-3" />
        <div class="flex justify-between">
          <div class="title">
            <div>Subtotal</div>
            <div>Shipping</div>
          </div>
          <div class="price">
            <div>
              {{ convertCurrency(orderShop.subtotal - orderShop.total_discount) }}
            </div>
            <div
              v-if="orderShop.total_shipping_fee === 0"
              class="text-right font-normal text-green-600"
            >
              FREE
            </div>
            <div v-else>
              {{ convertCurrency(orderShop.total_shipping_fee) }}
            </div>
          </div>
        </div>
        <UDivider class="my-3" />
        <div class="flex justify-between">
          <div class="font-semibold">
            Total
          </div>
          <div class="font-semibold">
            {{ convertCurrency(orderShop.total) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.title {
  @apply font-normal
}

.price {
  @apply text-right
}
</style>
