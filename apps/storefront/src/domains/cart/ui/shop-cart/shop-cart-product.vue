<script setup lang="ts">
import ShopCartQuantityUi from './shop-cart-quantity-ui.vue'
import { formatMinorCurrency } from '@arc/utils'
import type { CartProductItem } from '~/domains/cart/api/cart.shared'

const props = withDefaults(defineProps<{
  productCart: CartProductItem
  showQuantityControls?: boolean
  quantityDisabled?: boolean
}>(), {
  showQuantityControls: true,
  quantityDisabled: false,
})

const selectedOptionsLabel = computed(() =>
  props.productCart.inventory.selected_options
    .map(option => `${option.option_name}: ${option.value}`)
    .join(', '),
)
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
  <div class="mb-8 flex gap-4">
    <slot name="selection" />
    <div class="size-[180px] shrink-0 cursor-pointer overflow-hidden rounded-lg bg-media-product ring-1 ring-border-subtle">
      <NuxtImg
        :src="props.productCart.product.image_url"
        width="180"
        height="180"
        class="size-full object-cover object-center"
      />
    </div>

    <div class="flex w-full justify-between">
      <div class="space-y-2">
        <div>
          <h1 class="cursor-pointer text-lg font-semibold">
            {{ props.productCart.product.title }}
          </h1>

          <div
            v-if="selectedOptionsLabel"
            class=" text-text-muted"
          >
            {{ selectedOptionsLabel }}
          </div>
        </div>

        <div class="space-y-3">
          <div
            v-if="props.showQuantityControls"
            :class="$slots.quantity ? 'w-fit' : 'w-[45%]'"
          >
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
      </div>

      <div class="space-y-3 text-right">
        <div v-if="compareAtAmount">
          <div class="text-primary text-xl font-medium">
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
          class="text-xl font-medium text-text-strong"
        >
          {{ displayAmount }}
        </div>
      </div>
    </div>
  </div>
</template>
