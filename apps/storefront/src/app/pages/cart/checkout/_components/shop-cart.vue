<script setup lang="ts">
import CheckoutShopSummary from '~/domains/cart/ui/shop-cart/checkout-shop-summary.vue'
import type { CartShopGroup } from '~/domains/cart/api/cart.shared'
import CartShopNote from '~/domains/cart/ui/shop-cart/cart-shop-note.vue'
import CartShopPromoCodes from '~/domains/cart/ui/shop-cart/cart-shop-promo-codes.vue'
import ShopCartCard from '~/domains/cart/ui/shop-cart/shop-cart-card.vue'
import ShopCartFooter from '~/domains/cart/ui/shop-cart/shop-cart-footer.vue'
import OrderItemsTable from '~/domains/me/ui/order-shop/order-items-table.vue'
import type { CheckoutQuoteShop } from '~/domains/me/api/order/contracts/order.contract'

const props = withDefaults(defineProps<{
  shopCart: CartShopGroup
  quoteShop?: CheckoutQuoteShop
  checkoutCurrency?: string
}>(), {
  quoteShop: undefined,
  checkoutCurrency: undefined,
})

const selectedItems = computed(() => props.shopCart.items.filter(prod => !!prod.is_selected))

const itemRows = computed(() => selectedItems.value.map(item => ({
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
    v-if="selectedItems.length > 0"
    :shop-name="props.shopCart?.shop?.name"
  >
    <OrderItemsTable :rows="itemRows" />

    <template #footer>
      <ShopCartFooter summary-class="w-2/5">
        <template #promo-codes>
          <CartShopPromoCodes
            :shop-id="props.shopCart?.shop?.id"
            :shop-name="props.shopCart?.shop?.name"
          />
        </template>

        <template #note>
          <CartShopNote :shop-cart="props.shopCart" />
        </template>

        <template #summary>
          <CheckoutShopSummary
            :shop-cart="props.shopCart"
            :quote-shop="props.quoteShop"
            :checkout-currency="props.checkoutCurrency"
          />
        </template>
      </ShopCartFooter>
    </template>
  </ShopCartCard>
</template>
