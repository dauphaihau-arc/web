<script setup lang="ts">
import type { GetProductsResponseItem } from '~/shared/api/product/list'
import { routes } from '~/shared/navigation/routes'

const props = defineProps<{
  product: GetProductsResponseItem
  autoSize?: boolean
  fill?: boolean
}>()
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
      :src="props.product.image?.url"
      :class="[
        'rounded-lg object-cover',
        props.fill ? 'size-full' : props.autoSize ? 'size-full' : 'h-[160px] w-[250px]',
      ]"
    />
    <div class="absolute bottom-3 left-3 flex gap-1 space-y-0.5 rounded-lg bg-white px-2.5 py-1">
      <p class="text-md font-medium text-customGray-950">
        {{ convertCurrency(props.product.inventory?.sale_price || props.product.inventory?.price) }}
      </p>
    </div>
    <slot name="content" />
  </NuxtLink>
</template>
