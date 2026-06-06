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
    id: 'confirm-cancel',
    label: 'Confirm cancel',
    variant: 'danger' as const,
    shortcut: 'meta_enter' as const,
    allowWhileInputFocused: true,
    loading: isPending,
    run: confirmCancel,
  },
])
</script>

<template>
  <BaseDialog
    :actions="actions"
  >
    <div class="space-y-1">
      <h1 class="text-2xl font-bold">
        Cancel order
      </h1>
      <p class="text-sm text-text-muted">
        This will cancel the order for the buyer before shipment. Use this only when fulfillment cannot continue.
      </p>
    </div>
  </BaseDialog>
</template>
