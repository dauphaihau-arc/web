<script setup lang="ts">
import type { ProductInventory } from '~/shared/types/product'
import type { Shop } from '~/shared/types/shop'
import { useUpdateCart } from '~/shared/server-state/cart'
import type { ResponseGetCart } from '~/shared/types/request-api/cart'

const { checked, inventory_id, shopId } = defineProps<{
  checked: boolean
  inventory_id: ProductInventory['id']
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

      const foundShopCart = data.cart.shop_groups.find(sc => sc.shop.id === shopId)
      if (!foundShopCart) return oldData

      const newShopGroups = oldData.cart.shop_groups.map((sc) => {
        if (sc.shop.id === shopId) {
          const newItems = sc.items.map((prod) => {
            if (prod.inventory.id === inventory_id) {
              return { ...prod, is_selected: selectedCheckbox.value }
            }
            return prod
          })
          return {
            ...sc,
            items: newItems,
            total_shipping_fee: foundShopCart.total_shipping_fee,
          }
        }
        return sc
      })

      return {
        ...oldData,
        cart: {
          ...oldData.cart,
          shop_groups: newShopGroups,
        },
        summary: data.summary,
      }
    })
  },
})

watch(() => selectedCheckbox.value, async () => {
  updateProductCart({
    inventory_id,
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
