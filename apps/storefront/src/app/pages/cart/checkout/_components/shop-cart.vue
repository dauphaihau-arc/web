<script setup lang="ts">
import type { CartShopGroup } from '~/domains/cart/api/cart.shared'
import CartShopNote from '~/domains/cart/ui/shop-cart/cart-shop-note.vue'
import CartShopPromoCoupons from '~/domains/cart/ui/shop-cart/cart-shop-promo-coupons.vue'
import CartShopQuantity from '~/domains/cart/ui/shop-cart/cart-shop-quantity.vue'
import ShippingSelect from '~/domains/cart/ui/shop-cart/shipping-select.vue'
import ShopCartCard from '~/domains/cart/ui/shop-cart/shop-cart-card.vue'
import ShopCartFooter from '~/domains/cart/ui/shop-cart/shop-cart-footer.vue'
import ShopCartProduct from '~/domains/cart/ui/shop-cart/shop-cart-product.vue'

const props = defineProps<{
  shopCart: CartShopGroup
}>()

const selectedItems = computed(() => props.shopCart.items.filter(prod => !!prod.is_selected))
</script>

<template>
  <ShopCartCard
    v-if="selectedItems.length > 0"
    :shop-name="props.shopCart?.shop?.name"
  >
    <ShopCartProduct
      v-for="productCart of selectedItems"
      :key="productCart?.inventory?.id"
      :product-cart="productCart"
    >
      <template #quantity>
        <CartShopQuantity
          :key="productCart.quantity"
          :shop-id="props.shopCart?.shop?.id"
          :product-cart="productCart"
        />
      </template>
    </ShopCartProduct>

    <template #footer>
      <ShopCartFooter>
        <template #coupons>
          <CartShopPromoCoupons :shop-id="props.shopCart?.shop?.id" />
        </template>

        <template #note>
          <CartShopNote :shop-cart="props.shopCart" />
        </template>

        <template #shipping>
          <ShippingSelect :shop-cart="props.shopCart" />
        </template>
      </ShopCartFooter>
    </template>
  </ShopCartCard>
</template>
