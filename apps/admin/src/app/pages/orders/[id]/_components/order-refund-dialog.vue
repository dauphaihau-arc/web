<script setup lang="ts">
import type { AdminOrderRefundAction } from '~/domains/orders/api/contracts/admin-orders.contract'
import BaseDialog from '@arc/ui/patterns/dialog/base-dialog.vue'
import { useAdminUpdateOrderRefund } from '~/domains/orders/mutations/update-refund.mutation'
import {
  ADMIN_ORDER_REFUND_ACTION_OPTIONS,
  formatOrderStatusLabel,
  isAdminOrderRefundAction,
} from '~/domains/orders/utils/order-presentation'

const props = defineProps<{
  orderId: string
  refundStatus?: string
}>()

const dialog = useModal()
const { mutateAsync: updateRefund, isPending } = useAdminUpdateOrderRefund()

const action = ref<AdminOrderRefundAction>('retry')
const reason = ref('')

const actionOptions = ADMIN_ORDER_REFUND_ACTION_OPTIONS

const description = computed(() =>
  props.refundStatus
    ? `Current refund status: ${formatOrderStatusLabel(props.refundStatus)}.`
    : 'No refund has been requested for this order yet. A retry or a manual success returns the whole remaining refundable amount.',
)

function setAction(value: unknown) {
  if (typeof value === 'string' && isAdminOrderRefundAction(value)) {
    action.value = value
  }
}

async function confirm() {
  await updateRefund({
    orderId: props.orderId,
    body: {
      action: action.value,
      ...(reason.value.trim() ? { reason: reason.value.trim() } : {}),
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
    id: 'update-refund',
    label: 'Update refund',
    variant: 'danger' as const,
    loading: isPending,
    disabled: isPending,
    run: confirm,
  },
])
</script>

<template>
  <BaseDialog
    title="Update refund"
    :description="description"
    :actions="actions"
  >
    <div class="space-y-4">
      <UFormGroup label="Action">
        <USelectMenu
          :model-value="action"
          :options="actionOptions"
          value-attribute="value"
          option-attribute="label"
          :disabled="isPending"
          @update:model-value="setAction"
        />
      </UFormGroup>

      <UFormGroup
        label="Reason"
        help="Optional. Stored on the refund record and shown to operators."
      >
        <UTextarea
          v-model="reason"
          :rows="3"
          maxlength="1000"
          :disabled="isPending"
        />
      </UFormGroup>
    </div>
  </BaseDialog>
</template>
