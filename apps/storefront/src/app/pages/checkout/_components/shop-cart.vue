<script setup lang="ts">
import CheckoutNowPromoCodes from './checkout-now-promo-codes.vue'
import CheckoutShopSummary from '~/domains/cart/ui/shop-cart/checkout-shop-summary.vue'
import ShopCartCard from '~/domains/cart/ui/shop-cart/shop-cart-card.vue'
import ShopCartFooter from '~/domains/cart/ui/shop-cart/shop-cart-footer.vue'
import ShopCartNoteUi from '~/domains/cart/ui/shop-cart/shop-cart-note-ui.vue'
import OrderItemsTable from '~/domains/me/ui/order-shop/order-items-table.vue'
import { useCartStore } from '~/domains/cart/stores/cart.store'
import { useGetCart } from '~/domains/cart/queries/cart.query'
import type { CheckoutQuoteShop } from '~/domains/me/api/order/contracts/order.contract'

const props = withDefaults(defineProps<{
  quoteShop?: CheckoutQuoteShop
  checkoutCurrency?: string
  isPendingQuote?: boolean
}>(), {
  quoteShop: undefined,
  checkoutCurrency: undefined,
  isPendingQuote: false,
})

const cartStore = useCartStore()
const route = useRoute()

const tempCartId = route.query['c'] as string

const {
  data: dataGetCart,
} = useGetCart({ cart_id: tempCartId })

const shopCart = computed(() => dataGetCart.value?.cart && dataGetCart?.value?.cart.shop_groups[0])
const productCart = computed(() => shopCart.value?.items[0])
const showNoteInput = ref(!!cartStore.stateCheckoutNow.note)

const itemRows = computed(() => (shopCart.value?.items ?? []).map(item => ({
  id: item.inventory.id,
  title: item.product.title,
  imageUrl: item.product.image_url,
  variantLabels: item.inventory.selected_options
    .map(option => `${option.option_name}: ${option.value}`),
  quantity: item.quantity,
  unitPriceMinor: item.inventory.amount_minor,
  originalUnitPriceMinor: item.inventory.original_amount_minor,
  currency: item.inventory.currency,
})))
</script>

<template>
  <ShopCartCard
    v-if="shopCart && productCart"
    :shop-name="shopCart?.shop?.name"
  >
    <OrderItemsTable :rows="itemRows" />

    <template #footer>
      <ShopCartFooter>
        <template #promo-codes>
          <CheckoutNowPromoCodes
            :shop-id="shopCart.shop.id"
            :shop-name="shopCart.shop.name"
          />
        </template>

        <template #note>
          <ShopCartNoteUi
            v-model:note="cartStore.stateCheckoutNow.note"
            v-model:show-input="showNoteInput"
            :shop-name="shopCart.shop.name"
            :disabled="cartStore.stateCheckoutNow.isPendingCreateOrder"
          />
        </template>

        <template #summary>
          <CheckoutShopSummary
            :shop-cart="shopCart"
            :quote-shop="props.quoteShop"
            :checkout-currency="props.checkoutCurrency"
            :is-pending="props.isPendingQuote"
          />
        </template>
      </ShopCartFooter>
    </template>
  </ShopCartCard>
</template>

<style scoped>

</style>
