<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import type { RequestOrderSupportRequest } from '~/domains/me/api/order/contracts/order.contract'
import { useRequestOrderSupport } from '~/domains/me/mutations/orders/request-support.mutation'
import { useAccountTranslator } from '~/domains/me/ui/account-i18n'

const props = defineProps<{
  orderId: string
  initialNote?: string
}>()

const dialog = useModal()
const t = useAccountTranslator()
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
    :title="t('account.orders.supportDialog.title')"
    :description="t('account.orders.supportDialog.description')"
  >
    <UForm
      ref="formRef"
      :state="state"
      @submit="onSubmit"
    >
      <UFormGroup
        required
        :label="t('account.orders.supportDialog.label')"
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
          {{ t('account.common.close') }}
        </UButton>
        <UButton
          :loading="isPending"
          @click="formRef?.submit"
        >
          {{ t('account.orders.supportDialog.send') }}
        </UButton>
      </DialogActions>
    </template>
  </BaseDialog>
</template>
