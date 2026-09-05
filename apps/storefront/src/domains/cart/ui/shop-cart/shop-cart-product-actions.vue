<script setup lang="ts">
import { useDeleteProductCart } from '~/domains/cart/mutations/delete-product.mutation'
import type { CartProductItem } from '~/domains/cart/api/cart.shared'
import type { GetCartResponse } from '~/domains/cart/api/contracts/cart.contract'
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'

const props = defineProps<{
  productCart: CartProductItem
  shopId: string
}>()

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

      if (!foundShopCart) {
        newShopGroups = data.cart.shop_groups
      }
      else {
        newShopGroups = oldData.cart.shop_groups.map((sc) => {
          if (sc.shop.id === props.shopId) {
            return {
              ...sc,
              items: foundShopCart.items.filter(item => item.inventory.id !== props.productCart.inventory.id),
              shipping_minor: foundShopCart.shipping_minor,
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
</script>

<template>
  <div class="flex gap-4">
    <UButton
      variant="ghost"
      :icon="ICON_NAME_BY_ALIAS['edit']"
      color="gray"
      @click.once="deleteProductCart()"
    >
      Edit
    </UButton>
    <UButton
      variant="ghost"
      :icon="ICON_NAME_BY_ALIAS['trash']"
      color="gray"
      @click.once="deleteProductCart()"
    >
      Remove
    </UButton>
  </div>
</template>
