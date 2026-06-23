<script setup lang="ts">
import dayjs from 'dayjs'
import type { ElementType } from '@arc/contracts/utils'
import { PaymentTypes } from '@arc/enums/order'
import { formatMinorCurrency } from '@arc/utils'
import type { GetOrderShopsResponse } from '~/shared/api/me/order/contracts/order.contract'

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
          <div class="text-text-muted">
            Your {{ orderShop.payment.card_funding ?? '' }} card information was not shared with this shop
          </div>
        </div>
        <div v-else-if="orderShop.payment.type === PaymentTypes.CASH">
          Cash
        </div>
        <div
          v-if="orderShop.payment.refund_status"
          class="pt-2 text-sm text-text-subtle"
        >
          Refund: {{ orderShop.payment.refund_status.replaceAll('_', ' ') }}
          <span v-if="orderShop.payment.refunded_at">
            on {{ dayjs(orderShop.payment.refunded_at).format('MMM DD, YYYY HH:mm') }}
          </span>
          <div v-if="orderShop.payment.refund_failed_reason">
            {{ orderShop.payment.refund_failed_reason }}
          </div>
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
              {{ formatMinorCurrency(orderShop.subtotal_minor, orderShop.currency) }}
            </div>
            <div>
              {{ formatMinorCurrency(orderShop.discount_minor, orderShop.currency) }}
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
              {{ formatMinorCurrency(orderShop.subtotal_minor - orderShop.discount_minor, orderShop.currency) }}
            </div>
            <div
              v-if="orderShop.shipping_minor === 0"
              class="text-right font-normal text-primary"
            >
              FREE
            </div>
            <div v-else>
              {{ formatMinorCurrency(orderShop.shipping_minor, orderShop.currency) }}
            </div>
          </div>
        </div>
        <UDivider class="my-3" />
        <div class="flex justify-between">
          <div class="font-semibold">
            Total
          </div>
          <div class="font-semibold">
            {{ formatMinorCurrency(orderShop.total_minor, orderShop.currency) }}
          </div>
        </div>
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
