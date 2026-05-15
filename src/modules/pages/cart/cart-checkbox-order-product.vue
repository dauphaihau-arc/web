<script setup lang="ts">
import type { ProductInventory } from '~/shared/types/product'
import type { Shop } from '~/shared/types/shop'
import { useUpdateCart } from '~/shared/services/cart'
import type { ResponseGetCart } from '~/shared/types/request-api/cart'

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

      const foundShopCart = data.cart.shopGroups.find(sc => sc.shop.id === shopId)
      if (!foundShopCart) return oldData

      const newShopGroups = oldData.cart.shopGroups.map((sc) => {
        if (sc.shop.id === shopId) {
          const newItems = sc.items.map((prod) => {
            if (prod.inventory.id === inventoryId) {
              return { ...prod, isSelected: selectedCheckbox.value }
            }
            return prod
          })
          return {
            ...sc,
            items: newItems,
            totalShippingFee: foundShopCart.totalShippingFee,
          }
        }
        return sc
      })

      return {
        ...oldData,
        cart: {
          ...oldData.cart,
          shopGroups: newShopGroups,
        },
        summary: data.summary,
      }
    })
  },
})

watch(() => selectedCheckbox.value, async () => {
  updateProductCart({
    inventoryId,
    isSelected: selectedCheckbox.value,
  })
})
</script>

<template>
  <UCheckbox
    v-model="selectedCheckbox"
    class="mb-2"
  />
</template>
