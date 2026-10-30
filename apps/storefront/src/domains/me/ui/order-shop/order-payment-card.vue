<script setup lang="ts">
import dayjs from 'dayjs'
import { PaymentTypes } from '@arc/enums/order'
import type { ElementType } from '@arc/contracts/utils'
import type { GetOrderShopsResponse } from '~/domains/me/api/order/contracts/order.contract'
import { paymentMethodLabel } from './order-detail-presentation'

type OrderShop = ElementType<GetOrderShopsResponse['order_shops']>

defineProps<{
  orderShop: OrderShop
}>()

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
        Payment
      </div>
    </template>

    <div class="space-y-1 text-sm text-text-subtle">
      <div
        v-if="orderShop.payment.type === PaymentTypes.CARD"
        class="first-letter:capitalize"
      >
        {{ paymentMethodLabel(orderShop.payment) }}
      </div>
      <div v-else>
        Cash
      </div>

      <div
        v-if="orderShop.payment.refund_status"
        class="pt-2"
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
  </UCard>
</template>
