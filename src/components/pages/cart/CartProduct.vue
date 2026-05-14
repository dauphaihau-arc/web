<script setup lang="ts">
/*
  use in cart page, cart/checkout page
 */
import { ROUTES } from '~/config/enums/routes'
import type { Shop } from '~/types/shop'
import { useDeleteProductCart } from '~/services/cart'
import type { ResponseGetCart_ProductCart, ResponseGetCart } from '~/types/request-api/cart'

const props = defineProps<{
  productCart: ResponseGetCart_ProductCart
  shopId: Shop['id']
}>()

const route = useRoute()
const queryClient = useQueryClient()

const {
  mutate: deleteProductCart,
} = useDeleteProductCart(props.productCart.inventory.id, {
  onSuccess(data) {
    queryClient.setQueryData<ResponseGetCart>(['get-cart', 'my-cart'], (oldData) => {
      if (!oldData || !oldData.cart) return oldData
      if (!data.cart) return { ...oldData, cart: data.cart }
      const foundShopCart = data.cart.shop_carts.find(sc => sc.shop.id === props.shopId)

      let newShopCarts = oldData.cart.shop_carts

      // products field be empty
      if (!foundShopCart) {
        newShopCarts = data.cart.shop_carts
      }
      else {
        // update total_shipping_fee & products fields
        newShopCarts = oldData.cart.shop_carts.map((sc) => {
          if (sc.shop.id === props.shopId) {
            return {
              ...sc,
              products: foundShopCart.products.filter(prod => prod.inventory.id !== props.productCart.inventory.id),
              total_shipping_fee: foundShopCart?.total_shipping_fee,
            }
          }
          return sc
        })
      }

      return {
        ...oldData,
        cart: {
          ...oldData.cart,
          summary_cart: data.cart.summary_cart,
          products_recent_update: data.cart.products_recent_update,
          shop_carts: newShopCarts,
        },
        summary_order: data.summary_order,
      }
    })
  },
})

// const percentCoupon = computed(() => {
//   const coupon = props.productCart.percent_coupon;
//   if (coupon) {
//     return {
//       ...coupon,
//       endInDays: Math.abs(dayjs(coupon.start_date).diff(coupon?.end_date, 'day')),
//     };
//   }
//   return undefined;
// });

const goToDetailProduct = () => {
  navigateTo(`${ROUTES.PRODUCTS}/${props.productCart.product.id}`)
}
</script>

<template>
  <div
    v-if="props.productCart?.inventory"
    class="mb-8 flex gap-4"
  >
    <div
      v-if="route.path === ROUTES.CART"
      class="flex flex-col justify-center"
    >
      <CartCheckboxOrderProduct
        :shop-id="shopId"
        :checked="(props.productCart.is_select_order)"
        :inventory-id="props.productCart.inventory.id"
      />
    </div>

    <NuxtImg
      :src="`domainAwsS3/${props.productCart?.product?.image.relative_url}`"
      width="180"
      height="180"
      class="max-h-[180px] max-w-[180px] cursor-pointer rounded"
      @click="goToDetailProduct"
    />

    <div class="flex w-full justify-between">
      <div class="w-3/5 space-y-3">
        <div class="space-y-0.5">
          <h1
            class="cursor-pointer truncate text-xl font-semibold"
            @click="goToDetailProduct"
          >
            {{ props.productCart?.product?.title }}
          </h1>

          <CartVariantsProduct :product-cart="props.productCart" />
        </div>

        <CartModifyQuantityProduct
          :key="props.productCart.quantity"
          :shop-id="shopId"
          :product-cart="props.productCart"
          class="w-2/5"
        />

        <div class="flex gap-5">
          <UTooltip text="Feature not available">
            <div class="flex cursor-pointer items-center gap-1">
              <Icon name="uil:pen" />
              <p>Edit</p>
            </div>
          </UTooltip>
          <div
            v-if="route.path === ROUTES.CART"
            class="flex cursor-pointer items-center gap-1"
            @click.once="deleteProductCart()"
          >
            <Icon name="uil:trash" />
            <p>Remove</p>
          </div>
        </div>
      </div>

      <div class="space-y-2 text-right">
        <div v-if="props.productCart.inventory.sale_price && props.productCart.percent_coupon">
          <div class="text-xl font-medium text-green-700">
            {{ convertCurrency(props.productCart.inventory.sale_price) }}
          </div>
          <div class="text-sm text-zinc-500">
            <span class="line-through">
              {{ convertCurrency(props.productCart.inventory.price) }}
            </span>
            ({{ props.productCart.percent_coupon.percent_off }}% off)
          </div>
          <!--          <div -->
          <!--            v-if="percentCoupon && percentCoupon.endInDays <= COUPON_CONFIG.AMOUNT_DAYS_WARN_END_SALE" -->
          <!--            class="mt-1 font-medium text-green-700" -->
          <!--          > -->
          <!--            Sale ends in {{ percentCoupon.endInDays }} days -->
          <!--          </div> -->
        </div>
        <div
          v-else
          class="text-xl font-medium text-customGray-950"
        >
          {{ convertCurrency(props.productCart.inventory.price) }}
        </div>

        <UBadge
          v-if="props.productCart.freeship_coupon"
          color="green"
          variant="solid"
        >
          Free shipping
        </UBadge>
      </div>
    </div>
  </div>
</template>
