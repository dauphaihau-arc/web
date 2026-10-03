<script setup lang="ts">
import { useUpdateCart } from '~/domains/cart/mutations/update-cart.mutation'
import { applyPricedCartUpdate } from '~/domains/cart/utils/apply-priced-cart-update'
import type { GetCartResponse } from '~/domains/cart/api/contracts/cart.contract'

const { checked, inventoryId } = defineProps<{
  checked: boolean
  inventoryId: string
}>()

const queryClient = useQueryClient()

const selectedCheckbox = ref(checked)

const {
  mutate: updateProductCart,
} = useUpdateCart({
  onSuccess(data) {
    queryClient.setQueryData<GetCartResponse>(
      ['get-cart', 'my-cart'],
      oldData => applyPricedCartUpdate(oldData, data),
    )
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
    size="xl"
    class="mb-2"
    :ui="{ base: 'size-5', rounded: 'rounded-md' }"
  />
</template>
