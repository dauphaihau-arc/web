<script setup lang="ts">
import dayjs from 'dayjs'
import type { ElementType } from '@arc/contracts/utils'
import { PaymentTypes } from '@arc/enums/order'
import { formatMinorCurrency } from '@arc/utils'
import type { GetOrderShopsResponse } from '~/domains/me/api/order/contracts/order.contract'
import { paymentMethodLabel } from '~/domains/me/ui/order-shop/order-detail-presentation'

const props = defineProps<{
  orderShop: ElementType<GetOrderShopsResponse['order_shops']>
}>()

const showMore = ref(false)

const regularMerchandiseMinor = computed(() => props.orderShop.subtotal_minor + props.orderShop.sale_discount_minor)
const saleDiscountMinor = computed(() => props.orderShop.sale_discount_minor)
const codeDiscountMinor = computed(() => props.orderShop.discount_minor)
const shippingDiscountMinor = computed(() => props.orderShop.shipping_discount_minor ?? 0)
</script>

<template>
  <div>
    <UButton
      color="gray"
      class="relative z-10 -ml-2.5 mb-2"
      variant="ghost"
      :trailing-icon="showMore ? 'i-material-symbols:keyboard-arrow-up' : 'i-material-symbols:keyboard-arrow-down'"
      @click="showMore = !showMore"
    >
      Show {{ showMore ? 'less':'more' }}
    </UButton>

    <div
      v-if="showMore"
      class="flex flex-col gap-4 md:flex-row md:justify-between md:gap-0"
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
            {{ paymentMethodLabel(orderShop.payment) }}
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

      <div class="w-full md:w-1/3">
        <div class="flex flex-col gap-2">
          <div class="flex justify-between">
            <div class="title">
              <div>Subtotal</div>
              <div v-if="saleDiscountMinor > 0">
                Sale savings
              </div>
              <div v-if="codeDiscountMinor > 0">
                Code savings
              </div>
            </div>
            <div class="price">
              <div>
                {{ formatMinorCurrency(regularMerchandiseMinor, orderShop.currency) }}
              </div>
              <div v-if="saleDiscountMinor > 0">
                {{ formatMinorCurrency(saleDiscountMinor, orderShop.currency) }}
              </div>
              <div v-if="codeDiscountMinor > 0">
                {{ formatMinorCurrency(codeDiscountMinor, orderShop.currency) }}
              </div>
            </div>
          </div>
          <div class="flex justify-between">
            <div class="title">
              <div>Shipping</div>
              <div v-if="shippingDiscountMinor > 0">
                Shipping savings
              </div>
            </div>
            <div class="price">
              <div>
                {{ formatMinorCurrency(orderShop.shipping_minor, orderShop.currency) }}
              </div>
              <div v-if="shippingDiscountMinor > 0">
                {{ formatMinorCurrency(shippingDiscountMinor, orderShop.currency) }}
              </div>
            </div>
          </div>
          <UDivider class="my-3" />
          <div class="flex justify-between font-semibold text-text-strong">
            <div class="title">
              Total
            </div>
            <div class="price">
              {{ formatMinorCurrency(orderShop.total_minor, orderShop.currency) }}
            </div>
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
