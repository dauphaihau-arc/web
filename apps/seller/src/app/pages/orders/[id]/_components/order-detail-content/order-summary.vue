<script lang="ts" setup>
import dayjs from 'dayjs'
import { formatMinorCurrency } from '@arc/utils'
import type { ShopOrder } from '~/shared/types/shop-order-detail'

const props = defineProps<{
  assetHost: string
  order: ShopOrder
}>()

function buildAssetUrl(assetHost: string, storageKey?: string) {
  if (!storageKey || !assetHost) {
    return ''
  }

  return `${assetHost}/${storageKey.replace(/^\/+/, '')}`
}

function formatAmountWithShortLabel(amountMinor: number) {
  return formatMinorCurrency(amountMinor, props.order.currency)
}
</script>

<template>
  <UCard>
    <div class="text-lg font-semibold">
      <!--      Products ({{ order.products.length }}) -->
      Order summary
    </div>

    <div class="mt-5 hidden border-y border-border-subtle py-3 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted md:grid md:grid-cols-[minmax(0,1fr)_72px_168px_168px] md:gap-4">
      <div>Items</div>
      <div class="text-center">
        Qty
      </div>
      <div class="text-right">
        Unit price
      </div>
      <div class="text-right">
        Amount
      </div>
    </div>

    <div class="divide-y divide-border-subtle">
      <div
        v-for="product in order.products"
        :key="product.id"
        class="grid gap-4 py-5 md:grid-cols-[minmax(0,1fr)_72px_168px_168px] md:items-center"
      >
        <div class="flex min-w-0 items-start gap-4">
          <NuxtImg
            v-if="product.storage_key"
            :src="buildAssetUrl(assetHost, product.storage_key)"
            width="72"
            height="72"
            class="rounded-xl border border-border-subtle object-cover"
          />
          <div class="min-w-0 space-y-1">
            <div class="font-medium text-text-strong">
              {{ product.title }}
            </div>
            <div
              v-if="product.inventory.variant"
              class="text-sm text-text-muted"
            >
              Variant: {{ product.inventory.variant }}
            </div>
            <div class="text-sm text-text-muted md:hidden">
              Unit price: {{ formatAmountWithShortLabel(product.amount_minor) }}
            </div>
          </div>
        </div>

        <div class="text-sm text-text-muted md:text-center">
          {{ product.quantity }}
        </div>

        <div class="hidden text-right text-text-subtle md:block">
          {{ formatAmountWithShortLabel(product.amount_minor) }}
        </div>

        <div class="text-left md:text-right">
          <div class="font-medium text-text-strong">
            {{ formatAmountWithShortLabel(product.amount_minor * product.quantity) }}
          </div>
        </div>
      </div>
    </div>

    <div class="mt-2 border-t border-border-subtle pt-5">
      <div class="ml-auto w-full max-w-[28rem] space-y-3 text-sm text-text-subtle">
        <div
          v-if="order.payment.refund_status"
          class="flex items-center justify-between gap-4"
        >
          <span>Refund</span>
          <span class="capitalize">{{ order.payment.refund_status.replaceAll('_', ' ') }}</span>
        </div>
        <div
          v-if="order.payment.refund_failed_reason"
          class="text-right text-text-muted"
        >
          {{ order.payment.refund_failed_reason }}
        </div>
        <div class="flex items-center justify-between gap-4">
          <span>Subtotal</span>
          <span>{{ formatAmountWithShortLabel(order.subtotal_minor) }}</span>
        </div>
        <div class="flex items-center justify-between gap-4">
          <span>Discount</span>
          <span>{{ formatAmountWithShortLabel(order.discount_minor) }}</span>
        </div>
        <div class="flex items-center justify-between gap-4">
          <span>Shipping fee</span>
          <span>{{ formatAmountWithShortLabel(order.shipping_minor) }}</span>
        </div>
        <div class="border-t border-border-subtle pt-3" />
        <div class="flex items-center justify-between gap-4 text-base font-semibold text-text-strong">
          <span>Total</span>
          <span>{{ formatAmountWithShortLabel(order.total_minor) }}</span>
        </div>
      </div>

      <div
        v-if="order.note || order.customer_support_note || order.cancel_requested_at"
        class="mt-6 space-y-4 border-t border-border-subtle pt-5 text-sm text-text-subtle"
      >
        <div v-if="order.note">
          <div class="mb-1 font-medium text-text-strong">
            Buyer note
          </div>
          <div>{{ order.note }}</div>
        </div>
        <div v-if="order.customer_support_note">
          <div class="mb-1 font-medium text-text-strong">
            Buyer support request
          </div>
          <div>{{ order.customer_support_note }}</div>
        </div>
        <div v-if="order.cancel_requested_at">
          <div class="mb-1 font-medium text-text-strong">
            Cancel requested
          </div>
          <div>{{ dayjs(order.cancel_requested_at).format('MMM DD, YYYY HH:mm') }}</div>
        </div>
      </div>
    </div>
  </UCard>
</template>
