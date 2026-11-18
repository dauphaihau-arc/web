<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import type { RequestOrderCancelRequest } from '~/domains/me/api/order/contracts/order.contract'
import { useRequestOrderCancel } from '~/domains/me/mutations/orders/request-cancel.mutation'
import { useAccountTranslator } from '~/domains/me/ui/account-i18n'

const props = defineProps<{
  orderId: string
}>()

const dialog = useModal()
const t = useAccountTranslator()
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
    label: t('account.orders.cancelDialog.keepOrder'),
    variant: 'secondary' as const,
    allowWhileInputFocused: true,
    disabled: isPending,
    run: () => dialog.close(),
  },
  {
    id: 'cancel-order',
    label: t('account.orders.cancelDialog.cancelOrder'),
    variant: 'danger' as const,
    allowWhileInputFocused: true,
    loading: isPending,
    run: () => formRef.value?.submit(),
  },
])
</script>

<template>
  <BaseDialog
    :title="t('account.orders.cancelDialog.title')"
    :description="t('account.orders.cancelDialog.description')"
    :actions="actions"
    actions-full-width
  >
    <UForm
      ref="formRef"
      :state="state"
      @submit="onSubmit"
    >
      <UFormGroup
        :label="t('account.common.reason')"
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
