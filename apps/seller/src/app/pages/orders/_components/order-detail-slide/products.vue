<script lang="ts" setup>
import { fromMinorUnits, toCurrencyOption } from '@arc/utils'
import type { ShopOrder } from '~/app/pages/orders/[id]/_components/order-detail-content/types'

const props = defineProps<{
  assetHost: string
  order: ShopOrder
}>()

function buildAssetUrl(assetHostValue: string, storageKey?: string) {
  if (!storageKey || !assetHostValue) {
    return ''
  }

  return `${assetHostValue}/${storageKey.replace(/^\/+/, '')}`
}

function formatAmountWithShortLabel(amountMinor: number) {
  const amount = fromMinorUnits(amountMinor, props.order.currency)
  const currency = toCurrencyOption(props.order.currency).shortLabel

  return `${amount.toFixed(2)} ${currency}`
}
</script>

<template>
  <div>
    <div class="flex items-center gap-3">
      <div class="font-semibold">
        Products
      </div>
      <div class="rounded-md border border-border-subtle bg-elevated px-2 py-0.5 text-sm font-medium text-text-muted">
        {{ order.products.length }}
      </div>
    </div>

    <div class="mt-5 space-y-6">
      <div
        v-for="product in order.products"
        :key="product.id"
        class="grid grid-cols-[64px_minmax(0,1fr)_auto] items-start gap-4"
      >
        <div class="overflow-hidden rounded-xl border border-border-subtle bg-elevated">
          <NuxtImg
            v-if="product.storage_key"
            :src="buildAssetUrl(assetHost, product.storage_key)"
            width="64"
            height="64"
            class="h-16 w-16 object-cover"
          />
          <div
            v-else
            class="grid h-16 w-16 place-content-center text-xs text-text-muted"
          >
            N/A
          </div>
        </div>

        <div class="min-w-0 space-y-1">
          <div class="truncate font-medium text-text-strong">
            {{ product.title }}
          </div>
          <div class="text-text-muted">
            <span v-if="product.inventory.variant">
              {{ product.inventory.variant }}
            </span>
            <span v-if="product.inventory.variant && product.quantity">
              ·
            </span>
            <span>x{{ product.quantity }}</span>
          </div>
        </div>

        <div class="pt-1 text-right font-medium text-text-strong">
          {{ formatAmountWithShortLabel(product.amount_minor * product.quantity) }}
        </div>
      </div>
    </div>
  </div>
</template>
