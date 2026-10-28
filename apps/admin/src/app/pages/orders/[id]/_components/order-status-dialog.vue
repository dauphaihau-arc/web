<script setup lang="ts">
import { OrderStatuses } from '@arc/enums/order'
import BaseDialog from '@arc/ui/patterns/dialog/base-dialog.vue'
import { useAdminUpdateOrderStatus } from '~/domains/orders/mutations/update-status.mutation'
import type { AdminOrderActionStatus } from '~/domains/orders/utils/order-presentation'
import {
  ADMIN_ORDER_ACTION_STATUSES,
  formatOrderStatusLabel,
  isAdminOrderActionStatus,
} from '~/domains/orders/utils/order-presentation'

const props = defineProps<{
  orderId: string
  currentStatus: string
}>()

const dialog = useModal()
const { mutateAsync: updateStatus, isPending } = useAdminUpdateOrderStatus()

const availableStatuses = ADMIN_ORDER_ACTION_STATUSES.filter(
  (value): value is AdminOrderActionStatus => value !== props.currentStatus,
)

const status = ref<AdminOrderActionStatus>(availableStatuses[0] ?? OrderStatuses.CANCELED)
const cancelReason = ref('')

const statusOptions = availableStatuses.map(value => ({
  label: formatOrderStatusLabel(value),
  value,
}))

const isCancelStatus = computed(() => status.value === OrderStatuses.CANCELED)

function setStatus(value: unknown) {
  if (typeof value === 'string' && isAdminOrderActionStatus(value)) {
    status.value = value
  }
}

async function confirm() {
  if (availableStatuses.length === 0) {
    return
  }

  await updateStatus({
    orderId: props.orderId,
    body: {
      status: status.value,
      ...(isCancelStatus.value && cancelReason.value.trim()
        ? { cancel_reason: cancelReason.value.trim() }
        : {}),
    },
  })
  await dialog.close()
}

const actions = computed(() => [
  {
    id: 'close',
    label: 'Close',
    variant: 'secondary' as const,
    shortcut: 'escape' as const,
    allowWhileInputFocused: true,
    disabled: isPending,
    run: () => dialog.close(),
  },
  {
    id: 'update-status',
    label: 'Update status',
    shortcut: 'meta_enter' as const,
    allowWhileInputFocused: true,
    loading: isPending,
    disabled: isPending || availableStatuses.length === 0,
    run: confirm,
  },
])
</script>

<template>
  <BaseDialog
    title="Update order status"
    description="Force the order into a terminal state. Shipping and refund side effects are handled by the platform."
    :actions="actions"
  >
    <div class="space-y-4">
      <UFormGroup label="Status">
        <USelectMenu
          :model-value="status"
          :options="statusOptions"
          value-attribute="value"
          option-attribute="label"
          :disabled="isPending"
          @update:model-value="setStatus"
        />
      </UFormGroup>

      <UFormGroup
        v-if="isCancelStatus"
        label="Cancel reason"
        help="Optional. Visible to the buyer and stored on the order."
      >
        <UTextarea
          v-model="cancelReason"
          :rows="3"
          maxlength="1000"
          :disabled="isPending"
        />
      </UFormGroup>
    </div>
  </BaseDialog>
</template>
