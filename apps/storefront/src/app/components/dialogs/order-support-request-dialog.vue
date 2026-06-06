<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import type { RequestOrderSupportRequest } from '~/shared/api/me/order/contracts/order.contract'
import { useRequestOrderSupport } from '~/shared/server-state/me/orders/request-support.mutation'

const props = defineProps<{
  orderId: string
  initialNote?: string
}>()

const dialog = useModal()
const formRef = ref()
const state = reactive<RequestOrderSupportRequest>({
  support_note: props.initialNote ?? '',
})

const { mutateAsync: requestSupport, isPending } = useRequestOrderSupport()

async function onSubmit(event: FormSubmitEvent<RequestOrderSupportRequest>) {
  await requestSupport({
    orderId: props.orderId,
    body: event.data,
  })
  await dialog.close()
}
</script>

<template>
  <BaseDialog
    title="Help with order"
    description="Describe the issue or question for this order. Support can review it from the admin tools."
  >
    <UForm
      ref="formRef"
      :state="state"
      @submit="onSubmit"
    >
      <UFormGroup
        required
        label="Support request"
        name="support_note"
      >
        <UTextarea
          v-model="state.support_note"
          :rows="6"
          :maxlength="5000"
        />
      </UFormGroup>
    </UForm>

    <template #footer>
      <DialogActions full-width>
        <UButton
          color="gray"
          :disabled="isPending"
          @click="dialog.close"
        >
          Close
        </UButton>
        <UButton
          :loading="isPending"
          @click="formRef?.submit"
        >
          Send request
        </UButton>
      </DialogActions>
    </template>
  </BaseDialog>
</template>
