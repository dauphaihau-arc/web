<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import type { CartShopGroup } from '~/domains/cart/api/cart.shared'
import { useShopCartCopy } from './use-shop-cart-copy'

const props = defineProps<{
  shopCart: CartShopGroup
}>()

/**
 * The cart is merchandise-only: it carries no server-accepted charge, so the
 * summary shows the shop's merchandise total, any code saving applied to it,
 * and the resulting shop total. It states nothing while no line is selected,
 * and its total row is suppressed when it would only repeat a unit price
 * already printed on the lines; see `hasSelectedItems` and `showTotal`.
 */
const t = useShopCartCopy()

const currency = computed(() => props.shopCart.currency)

const merchandiseTotalMinor = computed(() => props.shopCart.total_minor)

const codeSavingsMinor = computed(() => props.shopCart.discount_minor)

const totalMinor = computed(() => merchandiseTotalMinor.value - codeSavingsMinor.value)

const selectedItems = computed(() => props.shopCart.items.filter(item => item.is_selected))

/**
 * Nothing selected: the shop contributes nothing to the order, so the summary
 * states nothing rather than a `$0.00` total the buyer would have to reconcile
 * against the unchecked lines above it.
 */
const hasSelectedItems = computed(() => selectedItems.value.length > 0)

/**
 * False only when the row can only repeat a number already on the card: the
 * product rows print unit prices and the shop total is `unit price x quantity`
 * over selected items, so one selected line at quantity 1 with no code saving
 * would state the same amount twice. Every other shape (a second line, a
 * quantity above 1, or a code saving) is money the buyer cannot read off the
 * lines, so the row stays.
 */
const showTotal = computed(
  () => codeSavingsMinor.value > 0
    || selectedItems.value.length !== 1
    || selectedItems.value[0]!.quantity !== 1,
)
</script>

<template>
  <div v-if="hasSelectedItems">
    <template v-if="codeSavingsMinor > 0">
      <div class="flex justify-between">
        <div class="title">
          <div>{{ t('cart.summary.subtotal') }}</div>
          <div>{{ t('cart.summary.codeSavings') }}</div>
        </div>
        <div class="price">
          <div>
            {{ formatMinorCurrency(merchandiseTotalMinor, currency) }}
          </div>
          <div>
            {{ formatMinorCurrency(codeSavingsMinor, currency) }}
          </div>
        </div>
      </div>
      <UDivider class="my-3" />
    </template>
    <div
      v-if="showTotal"
      class="flex justify-between"
    >
      <div class="font-semibold">
        {{ t('cart.summary.total') }}
      </div>
      <div class="font-semibold">
        {{ formatMinorCurrency(totalMinor, currency) }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.title {
  @apply font-normal
}

.price {
  @apply text-right
}
</style>
