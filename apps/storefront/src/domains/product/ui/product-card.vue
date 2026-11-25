<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import ProductCardImage from '~/domains/product/ui/product-card-image.vue'
import type { GetProductsResponseItem } from '~/domains/product/api/contracts/product.contract'
import { resolveProductImageUrl } from '~/domains/product/utils/product-image-url'
import { routes } from '~/shared/navigation/routes'
import { useLocalizedRoute } from '~/shared/composables/use-localized-route'

const props = withDefaults(defineProps<{
  product: GetProductsResponseItem
  showSalePercent?: boolean
}>(), {
  showSalePercent: true,
})

const router = useRouter()
const { localizePath } = useLocalizedRoute()
const { t } = useI18n()
const config = useRuntimeConfig()

const imageUrl = computed(() => {
  return resolveProductImageUrl(
    props.product.image,
    config.public.assetHost,
    'card_1x1',
  )
})

const stockNotice = computed(() => {
  if (!props.product.availability.in_stock) {
    return t('catalog.stock.outOfStock')
  }

  return props.product.availability.low_stock ? t('catalog.stock.lowStock') : ''
})

const displayAmount = computed(() => {
  const pricing = props.product.pricing
  if (!pricing?.currency || pricing.min_amount_minor == null) {
    return undefined
  }

  const minAmount = formatMinorCurrency(pricing.min_amount_minor, pricing.currency)
  if (pricing.max_amount_minor != null && pricing.max_amount_minor > pricing.min_amount_minor) {
    return `${t('catalog.product.from')} ${minAmount}`
  }

  return minAmount
})

const compareAtAmount = computed(() => {
  const pricing = props.product.pricing
  if (
    !pricing?.currency
    || pricing.min_amount_minor == null
    || (pricing.max_amount_minor != null && pricing.max_amount_minor > pricing.min_amount_minor)
    || pricing.original_min_amount_minor == null
    || pricing.original_min_amount_minor <= pricing.min_amount_minor
  ) {
    return undefined
  }

  return formatMinorCurrency(pricing.original_min_amount_minor, pricing.currency)
})

const salePercent = computed(() => {
  const pricing = props.product.pricing
  if (
    !pricing
    || pricing.min_amount_minor == null
    || (pricing.max_amount_minor != null && pricing.max_amount_minor > pricing.min_amount_minor)
    || pricing.original_min_amount_minor == null
    || pricing.original_min_amount_minor <= pricing.min_amount_minor
  ) {
    return undefined
  }

  return Math.round(
    ((pricing.original_min_amount_minor - pricing.min_amount_minor) / pricing.original_min_amount_minor) * 100,
  )
})

const hasDiscount = computed(() => {
  return compareAtAmount.value !== undefined
})

// Missing coverage is not an unavailable product: only an explicit `false` is
// a statement about the buyer's Market. Digital products arrive as `true`.
const shippingUnavailable = computed(() => {
  return props.product.shipping?.available === false
})
</script>

<template>
  <div
    class="group flex w-full cursor-pointer flex-col gap-1.5"
    data-testid="product-card"
    @click="() => router.push(localizePath(routes.productDetail(props.product.shop.slug, props.product.slug)))"
  >
    <ProductCardImage
      :src="imageUrl"
      frame-class="w-full"
      :frame-style="{ aspectRatio: '1 / 1' }"
      hover-scale
    />

    <div class="flex min-h-[104px] flex-col gap-0.5">
      <h1 class="truncate whitespace-nowrap text-sm font-semibold">
        {{ props.product?.title }}
      </h1>
      <div class="flex flex-wrap items-center gap-2">
        <p
          v-if="displayAmount !== undefined"
          :class="hasDiscount ? 'text-base font-semibold text-[var(--state-success-text)]' : 'text-base font-medium text-text-strong'"
        >
          {{ displayAmount }}
        </p>
        <template v-if="hasDiscount">
          <p class="text-sm text-text-muted line-through">
            {{ compareAtAmount }}
          </p>
          <p
            v-if="props.showSalePercent"
            class="text-sm text-text-muted"
          >
            {{ $t('catalog.product.percentOff', { percent: salePercent }) }}
          </p>
        </template>
      </div>
      <div class="flex h-5 items-center gap-1 text-sm text-text-subtle">
        <AppIcon
          name="shop"
          size="xs"
        />
        <p class="truncate">
          {{ props.product?.shop.shop_name }}
        </p>
      </div>
      <p
        v-if="stockNotice"
        class="text-[13px] text-state-danger-text"
      >
        {{ stockNotice }}
      </p>
      <p
        v-if="shippingUnavailable"
        data-testid="product-card-shipping-badge"
        class="mt-0.5 w-fit max-w-full rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium leading-tight text-text-muted"
      >
        {{ $t('catalog.shipping.reason.unsupportedDestination') }}
      </p>
    </div>
    <slot name="content" />
  </div>
</template>
