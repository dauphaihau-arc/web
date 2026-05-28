<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import type { GetProductsResponseItem } from '~/shared/api/product/contracts/product.contract'
import { routes } from '~/shared/navigation/routes'

const props = defineProps<{
  product: GetProductsResponseItem
  autoSize?: boolean
  fill?: boolean
}>()

const imageUrl = computed(() => {
  return props.product.image?.variants?.card_1x1?.url
    ?? props.product.image?.url
})

const displayAmount = computed(() => {
  const inventory = props.product.inventory
  if (!inventory) {
    return undefined
  }

  return formatMinorCurrency(inventory.amount_minor, inventory.currency)
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
        class="text-md font-medium text-customGray-950"
      >
        {{ displayAmount }}
      </p>
    </div>
    <slot name="content" />
  </NuxtLink>
</template>
