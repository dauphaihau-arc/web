<script setup lang="ts">
import { OrderStatuses } from '@arc/enums/order'
import { useShopUpdateOrderStatus } from '~/shared/server-state/shop/order/update-status.mutation'

const props = defineProps<{
  orderId: string
}>()

const dialog = useModal()
const { mutateAsync: updateStatus, isPending } = useShopUpdateOrderStatus()

async function confirmCancel() {
  await updateStatus({
    orderId: props.orderId,
    body: {
      status: OrderStatuses.CANCELED,
      cancel_reason: 'Canceled by seller',
    },
  })
  await dialog.close()
}
</script>

<template>
  <BaseDialog>
    <div class="space-y-1">
      <h1 class="text-2xl font-bold">
        Cancel order
      </h1>
      <p class="text-sm text-text-muted">
        This will cancel the order for the buyer before shipment. Use this only when fulfillment cannot continue.
      </p>
    </div>

    <template #footer>
      <DialogActions>
        <UButton
          color="gray"
          :disabled="isPending"
          @click="dialog.close"
        >
          Keep order
        </UButton>
        <UButton
          color="red"
          :loading="isPending"
          @click="confirmCancel"
        >
          Confirm cancel
        </UButton>
      </DialogActions>
    </template>
  </BaseDialog>
</template>
