<script setup lang="ts">
import type { ProductInventory } from '~/types/product'
import type { Shop } from '~/types/shop'
import { useUpdateCart } from '~/services/cart'
import type { ResponseGetCart } from '~/types/request-api/cart'

const { checked, inventoryId, shopId } = defineProps<{
  checked: boolean
  inventoryId: ProductInventory['id']
  shopId: Shop['id']
}>()

const queryClient = useQueryClient()

const selectedCheckbox = ref(checked)

const {
  mutate: updateProductCart,
} = useUpdateCart({
  onSuccess(data) {
    queryClient.setQueryData<ResponseGetCart>(['get-cart', 'my-cart'], (oldData) => {
      if (!oldData || !oldData.cart) return oldData
      if (!data.cart) return { ...oldData, cart: data.cart }

      const foundShopCart = data.cart.shop_carts.find(sc => sc.shop.id === shopId)
      if (!foundShopCart) return oldData

      // update is_select_order, total_shipping_fee fields
      const newShopCarts = oldData.cart.shop_carts.map((sc) => {
        if (sc.shop.id === shopId) {
          const newProducts = sc.products.map((prod) => {
            if (prod.inventory.id === inventoryId) {
              return { ...prod, is_select_order: selectedCheckbox.value }
            }
            return prod
          })
          return {
            ...sc,
            products: newProducts,
            total_shipping_fee: foundShopCart?.total_shipping_fee,
          }
        }
        return sc
      })

      return {
        ...oldData,
        cart: {
          ...oldData.cart,
          shop_carts: newShopCarts,
        },
        summary_order: data.summary_order,
      }
    })
  },
})

watch(() => selectedCheckbox.value, async () => {
  updateProductCart({
    inventory_id: inventoryId,
    is_select_order: selectedCheckbox.value,
  })
})
</script>

<template>
  <UCheckbox
    v-model="selectedCheckbox"
    class="mb-2"
  />
</template>
