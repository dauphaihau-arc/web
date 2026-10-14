<script setup lang="ts">
import ShopCartQuantityUi from './shop-cart-quantity-ui.vue'
import ShopCartProductOptions from './shop-cart-product-options/shop-cart-product-options.vue'
import { formatMinorCurrency } from '@arc/utils'
import type { CartProductItem } from '~/domains/cart/api/cart.shared'

const props = withDefaults(defineProps<{
  productCart: CartProductItem
  shopItems?: CartProductItem[]
  quantityDisabled?: boolean
}>(), {
  shopItems: () => [],
  quantityDisabled: false,
})

const quantity = defineModel<number>('quantity', { default: 0 })

const displayAmount = computed(() => formatMinorCurrency(
  props.productCart.inventory.amount_minor,
  props.productCart.inventory.currency,
))

const compareAtAmount = computed(() =>
  props.productCart.inventory.original_amount_minor
    ? formatMinorCurrency(
        props.productCart.inventory.original_amount_minor,
        props.productCart.inventory.currency,
      )
    : undefined,
)
</script>

<template>
  <div class="mb-6 grid grid-cols-[auto_1fr_auto] items-start gap-x-3 gap-y-4 md:mb-8 md:flex md:items-stretch md:gap-4">
    <!--
      Mobile: the media cell is the positioning context for the selection
      checkbox, which overlays the image. Desktop: the cell dissolves so the
      selection slot and the image become direct siblings in the row, exactly as
      the flex layout expects.
    -->
    <div class="relative col-start-1 row-start-1 md:contents">
      <div class="absolute left-2 top-2 z-10 md:static md:flex">
        <slot name="selection" />
      </div>

      <div class="size-24 shrink-0 cursor-pointer overflow-hidden rounded-lg bg-media-product ring-1 ring-border-subtle md:size-[180px]">
        <NuxtImg
          :src="props.productCart.product.image_url"
          width="180"
          height="180"
          class="size-full object-cover object-center"
        />
      </div>
    </div>

    <!--
      Mobile: dissolved into the outer grid so the title/options, the controls
      and the price can occupy their own cells. Desktop: the single column that
      holds the info block on the left and the price at the top right.
    -->
    <div class="contents md:grid md:w-full md:min-w-0 md:grid-cols-[1fr_auto]">
      <div class="col-start-2 col-end-4 row-start-1 min-w-0 space-y-2 md:col-start-1 md:col-end-2 md:row-start-1">
        <div class="space-y-1">
          <h1 class="line-clamp-2 text-base font-semibold md:line-clamp-none md:text-lg">
            {{ props.productCart.product.title }}
          </h1>

          <ShopCartProductOptions
            :product-cart="props.productCart"
            :sibling-items="props.shopItems"
          />
        </div>
      </div>

      <div class="col-start-1 col-end-4 row-start-2 flex flex-wrap items-center gap-x-4 gap-y-2 md:contents">
        <div class="flex min-w-0 items-center gap-x-3 md:col-start-1 md:col-end-2 md:row-start-2 md:block md:space-y-3">
          <div :class="$slots.quantity ? 'w-fit' : 'w-[45%]'">
            <slot name="quantity">
              <ShopCartQuantityUi
                v-model:quantity="quantity"
                :stock="props.productCart.inventory.stock"
                :disabled="props.quantityDisabled"
              />
            </slot>
          </div>

          <slot name="actions" />
        </div>

        <div class="ml-auto space-y-3 text-right md:col-start-2 md:col-end-3 md:row-start-1 md:ml-0">
          <div v-if="compareAtAmount">
            <div class="text-lg font-medium text-[var(--state-success-text)] md:text-xl">
              {{ displayAmount }}
            </div>
            <div class="text-sm text-text-muted">
              <span class="line-through">
                {{ compareAtAmount }}
              </span>
            </div>
          </div>
          <div
            v-else
            class="text-lg font-medium text-text-strong md:text-xl"
          >
            {{ displayAmount }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
