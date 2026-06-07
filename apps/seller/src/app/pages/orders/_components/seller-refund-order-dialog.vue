<script setup lang="ts">
import { useShopUpdateOrderRefund } from '~/shared/server-state/shop/order/update-refund.mutation'

const props = defineProps<{
  orderId: string
  isRetry?: boolean
}>()

const dialog = useModal()
const { mutateAsync: updateRefund, isPending } = useShopUpdateOrderRefund()

async function confirmRefund() {
  await updateRefund({
    orderId: props.orderId,
    body: {
      action: props.isRetry ? 'retry' : 'request',
    },
  })
  await dialog.close()
}
</script>

<template>
  <BaseDialog>
    <div class="space-y-1">
      <h1 class="text-2xl font-bold">
        {{ isRetry ? 'Retry refund' : 'Refund order' }}
      </h1>
      <p class="text-sm text-text-muted">
        {{
          isRetry
            ? 'This will re-submit the failed refund attempt for this order.'
            : 'This will start a refund for a paid order after fulfillment has already started or completed.'
        }}
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
          @click="confirmRefund"
        >
          {{ isRetry ? 'Retry refund' : 'Confirm refund' }}
        </UButton>
      </DialogActions>
    </template>
  </BaseDialog>
</template>
