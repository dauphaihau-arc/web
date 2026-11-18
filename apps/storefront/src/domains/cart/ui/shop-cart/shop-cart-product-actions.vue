<script setup lang="ts">
import { useDeleteProductCart } from '~/domains/cart/mutations/delete-product.mutation'
import { applyPricedCartUpdate } from '~/domains/cart/utils/apply-priced-cart-update'
import type { CartProductItem } from '~/domains/cart/api/cart.shared'
import type { GetCartResponse } from '~/domains/cart/api/contracts/cart.contract'
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import { useShopCartCopy } from './use-shop-cart-copy'

const props = defineProps<{
  productCart: CartProductItem
  shopId: string
}>()

const queryClient = useQueryClient()
const t = useShopCartCopy()

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
  <div class="-ml-1 flex gap-4 md:-ml-2">
    <UButton
      variant="ghost"
      :icon="ICON_NAME_BY_ALIAS['trash']"
      color="gray"
      :aria-label="t('cart.product.remove')"
      @click.once="deleteProductCart()"
    >
      <span class="hidden md:inline">{{ t('cart.product.remove') }}</span>
    </UButton>
  </div>
</template>
