<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import ProductCardImage from '~/domains/product/ui/product-card-image.vue'
import type { GetProductsResponseItem } from '~/domains/product/api/contracts/product.contract'
import { routes } from '~/shared/navigation/routes'
import { resolveProductImageUrl } from '~/domains/product/utils/product-image-url'

const props = defineProps<{
  product: GetProductsResponseItem
  autoSize?: boolean
  fill?: boolean
}>()

const config = useRuntimeConfig()

const imageUrl = computed(() => {
  return resolveProductImageUrl(
    props.product.image,
    config.public.assetHost,
    'card_1x1',
  )
})

const imageFrameClass = computed(() => {
  return props.fill || props.autoSize ? 'size-full' : 'aspect-[1/1] w-full'
})

const displayAmount = computed(() => {
  const pricing = props.product.pricing
  if (!pricing?.currency || pricing.min_amount_minor == null) {
    return undefined
  }

  const maxAmount = pricing.max_amount_minor
  return {
    prefix: maxAmount != null && maxAmount > pricing.min_amount_minor ? 'from' : undefined,
    amount: formatMinorCurrency(pricing.min_amount_minor, pricing.currency),
  }
})
</script>

<template>
  <NuxtLink
    :class="[
      'relative flex w-full cursor-pointer flex-col gap-2',
      props.fill ? 'h-full' : '',
    ]"
    :to="routes.productDetail(props.product.shop.slug, props.product.slug)"
  >
    <ProductCardImage
      :src="imageUrl"
      :frame-class="imageFrameClass"
    />
    <div
      v-if="displayAmount"
      class="absolute bottom-2 left-2 rounded-md bg-white px-1.5 py-0.5 md:bottom-3 md:left-3 md:rounded-lg md:px-2.5 md:py-1"
    >
      <p class="text-xs font-medium text-text-strong md:text-sm">
        <span
          v-if="displayAmount.prefix"
          class="mr-1 hidden md:inline"
        >{{ displayAmount.prefix }}</span>{{ displayAmount.amount }}
      </p>
    </div>
    <slot name="content" />
  </NuxtLink>
</template>
