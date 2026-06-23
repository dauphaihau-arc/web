<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import type { GetProductsResponseItem } from '~/shared/api/product/contracts/product.contract'
import { routes } from '~/shared/navigation/routes'
import { resolveProductImageUrl } from '~/shared/utils/storage-public-url'

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

const displayAmount = computed(() => {
  const pricing = props.product.pricing
  if (!pricing?.currency || pricing.min_amount_minor == null) {
    return undefined
  }

  const minAmount = formatMinorCurrency(pricing.min_amount_minor, pricing.currency)
  if (pricing.max_amount_minor != null && pricing.max_amount_minor > pricing.min_amount_minor) {
    return `from ${minAmount}`
  }

  return minAmount
})
</script>

<template>
  <NuxtLink
    :class="[
      'relative flex cursor-pointer flex-col gap-2',
      props.fill ? 'h-full' : '',
    ]"
    :to="routes.productDetail(props.product.shop.slug, props.product.slug)"
  >
    <NuxtImg
      :src="imageUrl"
      :class="[
        'rounded-lg object-cover',
        props.fill ? 'size-full' : props.autoSize ? 'size-full' : 'h-[160px] w-[250px]',
      ]"
    />
    <div class="absolute bottom-3 left-3 flex gap-1 space-y-0.5 rounded-lg bg-white px-2.5 py-1">
      <p
        v-if="displayAmount !== undefined"
        class="text-md font-medium text-text-strong"
      >
        {{ displayAmount }}
      </p>
    </div>
    <slot name="content" />
  </NuxtLink>
</template>
