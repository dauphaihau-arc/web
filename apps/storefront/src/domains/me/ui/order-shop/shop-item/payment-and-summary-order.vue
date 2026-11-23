<script setup lang="ts">
import type { ElementType } from '@arc/contracts/utils'
import { PaymentTypes } from '@arc/enums/order'
import { formatMinorCurrency } from '@arc/utils'
import type { GetOrderShopsResponse } from '~/domains/me/api/order/contracts/order.contract'
import { paymentMethodLabel, refundStatusLabel } from '~/domains/me/ui/order-shop/order-detail-presentation'
import { useAccountTranslator } from '~/domains/me/ui/account-i18n'
import { useLocaleFormatters } from '~/domains/market/composables/use-locale-formatters'

const props = defineProps<{
  orderShop: ElementType<GetOrderShopsResponse['order_shops']>
}>()

const t = useAccountTranslator()
const { formatDate } = useLocaleFormatters()

const showMore = ref(false)

const regularMerchandiseMinor = computed(() => props.orderShop.subtotal_minor + props.orderShop.sale_discount_minor)
const saleDiscountMinor = computed(() => props.orderShop.sale_discount_minor)
const codeDiscountMinor = computed(() => props.orderShop.discount_minor)
const shippingDiscountMinor = computed(() => props.orderShop.shipping_discount_minor ?? 0)
</script>

<template>
  <div class="space-y-2">
    <UButton
      color="gray"
      class="relative z-[1] -ml-2.5"
      variant="ghost"
      :trailing-icon="showMore ? 'i-material-symbols:keyboard-arrow-up' : 'i-material-symbols:keyboard-arrow-down'"
      @click="showMore = !showMore"
    >
      {{ showMore
        ? t('account.orders.summary.showLess')
        : t('account.orders.summary.showMore') }}
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
          {{ t('account.orders.summary.paymentMethod') }}
        </div>
        <div
          v-if="orderShop?.payment?.type === PaymentTypes.CARD"
          class="space-y-0.5"
        >
          <div class="first-letter:capitalize">
            {{ paymentMethodLabel(orderShop.payment, t) }}
          </div>
        </div>
        <div v-else-if="orderShop.payment.type === PaymentTypes.CASH">
          {{ t('account.orders.summary.cash') }}
        </div>
        <div
          v-if="orderShop.payment.refund_status"
          class="pt-2 text-sm text-text-subtle"
        >
          <template v-if="orderShop.payment.refunded_at">
            {{ t('account.orders.summary.refundOn', {
              status: refundStatusLabel(orderShop.payment.refund_status, t),
              date: formatDate(orderShop.payment.refunded_at, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            }) }}
          </template>
          <template v-else>
            {{ t('account.orders.summary.refund', {
              status: refundStatusLabel(orderShop.payment.refund_status, t),
            }) }}
          </template>
          <div v-if="orderShop.payment.refund_failed_reason">
            {{ orderShop.payment.refund_failed_reason }}
          </div>
        </div>
      </div>

      <div class="w-full md:w-1/3">
        <div class="flex flex-col gap-2">
          <div class="flex justify-between">
            <div class="title">
              <div>{{ t('account.common.subtotal') }}</div>
              <div v-if="saleDiscountMinor > 0">
                {{ t('account.orders.summary.saleSavings') }}
              </div>
              <div v-if="codeDiscountMinor > 0">
                {{ t('account.orders.summary.codeSavings') }}
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
              <div>{{ t('account.common.shipping') }}</div>
              <div v-if="shippingDiscountMinor > 0">
                {{ t('account.orders.summary.shippingSavings') }}
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
              {{ t('account.common.total') }}
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
