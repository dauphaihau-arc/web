<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import type { RequestOrderCancelRequest } from '~/shared/api/me/order/contracts/order.contract'
import { useRequestOrderCancel } from '~/shared/server-state/me/orders/request-cancel.mutation'

const props = defineProps<{
  orderId: string
}>()

const dialog = useModal()
const formRef = ref()
const state = reactive<RequestOrderCancelRequest>({
  cancel_reason: '',
})

const { mutateAsync: requestCancel, isPending } = useRequestOrderCancel()

async function onSubmit(event: FormSubmitEvent<RequestOrderCancelRequest>) {
  await requestCancel({
    orderId: props.orderId,
    body: event.data,
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
    id: 'cancel-order',
    label: 'Cancel order',
    variant: 'danger' as const,
    shortcut: 'meta_enter' as const,
    allowWhileInputFocused: true,
    loading: isPending,
    run: () => formRef.value?.submit(),
  },
])
</script>

<template>
  <BaseDialog
    title="Cancel order"
    description="This is available before the order ships. Add an optional reason for the cancellation."
    :actions="actions"
    actions-full-width
  >
    <UForm
      ref="formRef"
      :state="state"
      @submit="onSubmit"
    >
      <UFormGroup
        label="Reason"
        name="cancel_reason"
      >
        <UTextarea
          v-model="state.cancel_reason"
          :rows="5"
          :maxlength="1000"
        />
      </UFormGroup>
    </UForm>
  </BaseDialog>
</template>
