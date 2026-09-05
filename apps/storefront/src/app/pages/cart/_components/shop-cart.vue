<script setup lang="ts">
import CartShopNote from '~/domains/cart/ui/shop-cart/cart-shop-note.vue'
import CartShopPromoCoupons from '~/domains/cart/ui/shop-cart/cart-shop-promo-coupons.vue'
import CartCheckboxOrderProduct from '~/domains/cart/ui/shop-cart/checkbox-order-product.vue'
import CartShopQuantity from '~/domains/cart/ui/shop-cart/cart-shop-quantity.vue'
import ShippingSelect from '~/domains/cart/ui/shop-cart/shipping-select.vue'
import ShopCartCard from '~/domains/cart/ui/shop-cart/shop-cart-card.vue'
import ShopCartFooter from '~/domains/cart/ui/shop-cart/shop-cart-footer.vue'
import ShopCartProduct from '~/domains/cart/ui/shop-cart/shop-cart-product.vue'
import ShopCartProductActions from '~/domains/cart/ui/shop-cart/shop-cart-product-actions.vue'
import type { CartShopGroup } from '~/domains/cart/api/cart.shared'

const props = defineProps<{
  shopCart: CartShopGroup
}>()
</script>

<template>
  <ShopCartCard
    v-if="props.shopCart.items.length > 0"
    :shop-name="props.shopCart.shop?.name"
  >
    <ShopCartProduct
      v-for="productCart of props.shopCart.items"
      :key="productCart.inventory.id"
      :product-cart="productCart"
    >
      <template #selection>
        <div class="flex flex-col justify-center">
          <CartCheckboxOrderProduct
            :shop-id="props.shopCart.shop?.id"
            :checked="productCart.is_selected"
            :inventory-id="productCart.inventory.id"
          />
        </div>
      </template>
      <template #quantity>
        <CartShopQuantity
          :key="productCart.quantity"
          :shop-id="props.shopCart.shop?.id"
          :product-cart="productCart"
        />
      </template>

      <template #actions>
        <ShopCartProductActions
          :shop-id="props.shopCart.shop?.id"
          :product-cart="productCart"
        />
      </template>
    </ShopCartProduct>

    <template #footer>
      <ShopCartFooter>
        <template #coupons>
          <CartShopPromoCoupons :shop-id="props.shopCart.shop?.id" />
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
