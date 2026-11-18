<script setup lang="ts">
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import type { ElementType } from '@arc/contracts/utils'
import { formatMinorCurrency } from '@arc/utils'
import type { GetOrderShopsResponse } from '~/domains/me/api/order/contracts/order.contract'
import { useAccountTranslator } from '~/domains/me/ui/account-i18n'
import { useLocaleFormatters } from '~/domains/market/composables/use-locale-formatters'
import {
  buildOrderPackages,
  fulfillmentStatusLabel,
  fulfillmentStatusTone,
  orderItemsCount,
  orderPackageTone,
  orderStatusLabel,
  orderStatusTone,
} from './order-detail-presentation'

type OrderShop = ElementType<GetOrderShopsResponse['order_shops']>

const props = defineProps<{
  orderShop: OrderShop
}>()

const t = useAccountTranslator()
const { formatDate } = useLocaleFormatters()

const orderPackages = computed(() => buildOrderPackages(props.orderShop, t))
const packageCount = computed(() => orderPackages.value.counts.total)

/** The header badge must never contradict the stepper rendered below it. */
const fulfillmentBadge = computed(() => {
  const packages = orderPackages.value.packages

  if (packageCount.value === 0) {
    return { label: t('account.orders.progress.awaitingShipment'), tone: 'yellow' as const }
  }

  const [pkg] = packages

  if (packageCount.value === 1 && pkg && pkg.state !== 'canceled') {
    return { label: pkg.statusLabel, tone: orderPackageTone(pkg) }
  }

  return {
    label: fulfillmentStatusLabel(props.orderShop.fulfillment.status, t),
    tone: fulfillmentStatusTone(props.orderShop.fulfillment.status),
  }
})

/** Seller, placed date, item/package counts, and accepted total — nothing derived. */
const metaParts = computed(() => {
  const items = orderItemsCount(props.orderShop)
  const packages = packageCount.value
  const itemLabel = t(
    items === 1 ? 'account.orders.meta.item' : 'account.orders.meta.items',
    { count: items },
  )

  return [
    t('account.orders.meta.soldBy', { shop: props.orderShop.shop.shop_name }),
    t('account.orders.meta.placedOn', {
      date: formatDate(props.orderShop.created_at, { year: 'numeric', month: 'short', day: 'numeric' }),
    }),
    packages > 0
      ? t('account.orders.meta.itemsInPackages', {
          items: itemLabel,
          packages: t(
            packages === 1 ? 'account.orders.meta.package' : 'account.orders.meta.packages',
            { count: packages },
          ),
        })
      : itemLabel,
    t('account.orders.meta.total', {
      total: formatMinorCurrency(props.orderShop.total_minor, props.orderShop.currency),
    }),
  ]
})
</script>

<template>
  <div>
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div class="flex flex-wrap items-center gap-3">
        <h1 class="text-xl md:text-2xl">
          {{ t('account.orders.detail.orderHeading', { number: orderShop.order_number }) }}
        </h1>

        <StatusBadge
          :color="orderStatusTone(orderShop.status)"
          :label="orderStatusLabel(orderShop.status, t)"
          size="md"
          class="shrink-0 self-center capitalize"
        />

        <StatusBadge
          :color="fulfillmentBadge.tone"
          :label="fulfillmentBadge.label"
          size="md"
          class="shrink-0 self-center"
        />
      </div>

      <div
        v-if="$slots.actions"
        class="flex flex-wrap items-center gap-2"
      >
        <slot name="actions" />
      </div>
    </div>

    <div class="mt-2 text-sm text-text-muted">
      {{ metaParts.join(' · ') }}
    </div>
  </div>
</template>
