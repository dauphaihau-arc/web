<script setup lang="ts">
import { ROUTES } from '~/config/enums/routes'
import type { ResponseGetProducts_Product } from '~/types/request-api/product'

const props = defineProps<{
  product: ResponseGetProducts_Product
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
    :to="`${ROUTES.PRODUCTS}/${props.product.id}`"
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
        {{ convertCurrency(props.product.inventory?.salePrice || props.product.inventory?.price) }}
      </p>
    </div>
    <slot name="content" />
  </NuxtLink>
</template>
