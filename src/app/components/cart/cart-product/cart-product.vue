<script setup lang="ts">
/*
  use in cart page, cart/checkout page
 */
import CartCheckboxOrderProduct from './checkbox-order-product.vue'
import CartModifyQuantityProduct from './modify-quantity-product.vue'
import CartVariantsProduct from './variants-product.vue'
import { ROUTES } from '~/shared/config/enums/routes'
import { routes } from '~/shared/navigation/routes'
import { useDeleteProductCart } from '~/shared/server-state/cart/delete-product.mutation'
import type { CartProductItem } from '~/shared/api/cart/cart.shared'
import type { GetCartResponse } from '~/shared/api/cart/contracts/cart.contract'

const props = defineProps<{
  productCart: CartProductItem
  shopId: string
}>()

const route = useRoute()
const queryClient = useQueryClient()

const {
  mutate: deleteProductCart,
} = useDeleteProductCart(props.productCart.inventory.id, {
  onSuccess(data) {
    queryClient.setQueryData<GetCartResponse>(['get-cart', 'my-cart'], (oldData) => {
      if (!oldData || !oldData.cart) return oldData
      if (!data.cart) return { ...oldData, cart: data.cart }
      const foundShopCart = data.cart.shop_groups.find(sc => sc.shop.id === props.shopId)

      let newShopGroups = oldData.cart.shop_groups

      // items field be empty
      if (!foundShopCart) {
        newShopGroups = data.cart.shop_groups
      }
      else {
        newShopGroups = oldData.cart.shop_groups.map((sc) => {
          if (sc.shop.id === props.shopId) {
            return {
              ...sc,
              items: foundShopCart.items.filter(item => item.inventory.id !== props.productCart.inventory.id),
              total_shipping_fee: foundShopCart.total_shipping_fee,
            }
          }
          return sc
        })
      }

      return {
        ...oldData,
        cart: {
          ...oldData.cart,
          total_quantity: data.cart.total_quantity,
          recent_items: data.cart.recent_items,
          shop_groups: newShopGroups,
        },
        summary: data.summary,
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
  navigateTo(routes.productDetail(props.productCart.product.shop.slug, props.productCart.product.slug))
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
        :checked="props.productCart.is_selected"
        :inventory_id="props.productCart.inventory.id"
      />
    </div>

    <NuxtImg
      :src="props.productCart?.product?.image_url"
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
              <AppIcon name="edit" />
              <p>Edit</p>
            </div>
          </UTooltip>
          <div
            v-if="route.path === ROUTES.CART"
            class="flex cursor-pointer items-center gap-1"
            @click.once="deleteProductCart()"
          >
            <AppIcon name="trash" />
            <p>Remove</p>
          </div>
        </div>
      </div>

      <div class="space-y-2 text-right">
        <div v-if="props.productCart.inventory.sale_price">
          <div class="text-xl font-medium text-green-700">
            {{ convertCurrency(props.productCart.inventory.sale_price) }}
          </div>
          <div class="text-sm text-zinc-500">
            <span class="line-through">
              {{ convertCurrency(props.productCart.inventory.price) }}
            </span>
          </div>
        </div>
        <div
          v-else
          class="text-xl font-medium text-customGray-950"
        >
          {{ convertCurrency(props.productCart.inventory.price) }}
        </div>
      </div>
    </div>
  </div>
</template>
