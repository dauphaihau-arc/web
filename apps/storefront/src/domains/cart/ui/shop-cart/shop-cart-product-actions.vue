<script setup lang="ts">
import { useDeleteProductCart } from '~/domains/cart/mutations/delete-product.mutation'
import { applyPricedCartUpdate } from '~/domains/cart/utils/apply-priced-cart-update'
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
    queryClient.setQueryData<GetCartResponse>(
      ['get-cart', 'my-cart'],
      oldData => applyPricedCartUpdate(oldData, data),
    )
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
