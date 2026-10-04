<script lang="ts" setup>
import dayjs from 'dayjs'
import { formatMinorCurrency } from '@arc/utils'
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail'
import DataTable from '@arc/ui/primitives/data-table/data-table.vue'

const props = defineProps<{
  order: ShopOrder
}>()

type OrderSummaryRow = {
  id: string
  title: string
  variant?: string
  imageUrl?: string
  quantity: number
  unitPrice: string
  amount: string
}

const columns = [
  { key: 'items', label: 'Items' },
  { key: 'qty', label: 'Qty', class: 'w-20 text-center' },
  { key: 'unit', label: 'Unit price', class: 'w-40 text-right' },
  { key: 'amount', label: 'Amount', class: 'w-40 text-right' },
]

const emptyState = {
  icon: 'i-heroicons-shopping-bag-20-solid',
  label: 'No items in this order.',
}

const rows = computed<OrderSummaryRow[]>(() => props.order.products.map(product => ({
  id: product.id,
  title: product.title,
  variant: product.inventory.variant,
  imageUrl: product.image_url,
  quantity: product.quantity,
  unitPrice: formatAmountWithShortLabel(product.amount_minor),
  amount: formatAmountWithShortLabel(product.amount_minor * product.quantity),
})))

function formatAmountWithShortLabel(amountMinor: number) {
  return formatMinorCurrency(amountMinor, props.order.currency)
}

const regularMerchandiseMinor = computed(
  () => props.order.subtotal_minor + props.order.sale_discount_minor,
)

const subtotalAfterDiscountsMinor = computed(
  () => regularMerchandiseMinor.value - props.order.sale_discount_minor - props.order.discount_minor,
)

const shippingDiscountMinor = computed(
  () => props.order.shipping_discount_minor ?? 0,
)
</script>

<template>
  <UCard>
    <div class="text-lg font-semibold">
      <!--      Products ({{ order.products.length }}) -->
      Order summary
    </div>

    <DataTable
      class="mt-5"
      by="id"
      :rows="rows"
      :columns="columns"
      :selectable="false"
      :empty-state="emptyState"
    >
      <template #items-data="{ row }">
        <div class="flex min-w-0 items-start gap-4">
          <NuxtImg
            v-if="row.imageUrl"
            :src="row.imageUrl"
            width="72"
            height="72"
            class="rounded-xl border border-border-subtle object-cover"
          />
          <div class="min-w-0 space-y-1">
            <div
              class="truncate font-medium text-text-strong"
              :title="row.title"
            >
              {{ row.title }}
            </div>
            <div
              v-if="row.variant"
              class="text-sm text-text-muted"
            >
              Variant: {{ row.variant }}
            </div>
          </div>
        </div>
      </template>

      <template #qty-data="{ row }">
        <div class="text-center text-sm text-text-muted">
          {{ row.quantity }}
        </div>
      </template>

      <template #unit-data="{ row }">
        <div class="text-right text-text-subtle">
          {{ row.unitPrice }}
        </div>
      </template>

      <template #amount-data="{ row }">
        <div class="text-right font-medium text-text-strong">
          {{ row.amount }}
        </div>
      </template>
    </DataTable>

    <div class="mt-2 border-t border-border-subtle pt-5">
      <div class="ml-auto w-full max-w-md space-y-3 text-sm text-text-subtle">
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
          <span>Product(s) total</span>
          <span>{{ formatAmountWithShortLabel(regularMerchandiseMinor) }}</span>
        </div>
        <div
          v-if="order.sale_discount_minor > 0"
          class="flex items-center justify-between gap-4"
        >
          <span>Sale savings</span>
          <span>{{ formatAmountWithShortLabel(order.sale_discount_minor) }}</span>
        </div>
        <div
          v-if="order.discount_minor > 0"
          class="flex items-center justify-between gap-4"
        >
          <span>Code savings</span>
          <span>{{ formatAmountWithShortLabel(order.discount_minor) }}</span>
        </div>
        <div class="flex items-center justify-between gap-4">
          <span>Subtotal</span>
          <span>{{ formatAmountWithShortLabel(subtotalAfterDiscountsMinor) }}</span>
        </div>
        <div class="flex items-center justify-between gap-4">
          <span>Shipping charge</span>
          <span>{{ formatAmountWithShortLabel(order.shipping_minor) }}</span>
        </div>
        <div
          v-if="shippingDiscountMinor > 0"
          class="flex items-center justify-between gap-4"
        >
          <span>Shipping savings</span>
          <span>{{ formatAmountWithShortLabel(shippingDiscountMinor) }}</span>
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
