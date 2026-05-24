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
</script>

<template>
  <BaseDialog>
    <template #header>
      <div class="space-y-1">
        <h1 class="text-2xl font-bold">
          Cancel order
        </h1>
        <p class="text-sm text-zinc-500">
          This is available before the order ships. Add an optional reason for the cancellation.
        </p>
      </div>
    </template>

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

    <template #footer>
      <div class="flex justify-end gap-3">
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
          @click="formRef?.submit"
        >
          Cancel order
        </UButton>
      </div>
    </template>
  </BaseDialog>
</template>
