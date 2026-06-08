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

const actions = computed(() => [
  {
    id: 'keep-order',
    label: 'Keep order',
    variant: 'secondary' as const,
    shortcut: 'escape' as const,
    allowWhileInputFocused: true,
    disabled: isPending,
    run: () => dialog.close(),
  },
  {
    id: 'confirm-refund',
    label: props.isRetry ? 'Retry refund' : 'Confirm refund',
    variant: 'danger' as const,
    shortcut: 'meta_enter' as const,
    allowWhileInputFocused: true,
    loading: isPending,
    run: confirmRefund,
  },
])
</script>

<template>
  <BaseDialog
    :actions="actions"
  >
    <div class="space-y-1">
      <h1 class="text-2xl font-bold">
        {{ props.isRetry ? 'Retry refund' : 'Refund order' }}
      </h1>
      <p class="text-sm text-text-muted">
        {{
          props.isRetry
            ? 'This will re-submit the failed refund attempt for this order.'
            : 'This will start a refund for a paid order after fulfillment has already started or completed.'
        }}
      </p>
    </div>
  </BaseDialog>
</template>
