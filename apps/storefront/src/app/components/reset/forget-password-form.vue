<script setup lang="ts">
import { ResetPasswordViews } from '@arc/enums/common'
import { forgotPasswordFormSchema } from '@arc/schemas/forms/auth/forgot-password-form.schema'
import type { FormSubmitEvent } from '#ui/types'
import type { ForgotPasswordRequest } from '~/shared/api/auth/contracts/forgot-password.contract'
import { useForgetPassword } from '~/shared/server-state/auth/forgot-password.mutation'
import { toastCustom } from '~/shared/config/toast'

const emit = defineEmits<{
  changeView: [value: ResetPasswordViews]
}>()

const authStore = useAuthStore()
const toast = useToast()
const formRef = ref()

const stateSubmit = reactive({
  email: authStore.emailRequestForgetPassword,
})

const {
  mutateAsync: forgetPassword,
  isPending: isPendingForgetPassword,
} = useForgetPassword()

async function onSubmit(event: FormSubmitEvent<ForgotPasswordRequest>) {
  authStore.emailRequestForgetPassword = event.data.email
  try {
    await forgetPassword(event.data.email)
    emit('changeView', ResetPasswordViews.SEND_EMAIL_SUCCESS)
  }
  catch (error) {
    toast.add({
      ...toastCustom.error,
      title: 'An unknown error occurred. Please try again',
    })
  }
}
</script>

<template>
  <UForm
    ref="formRef"
    :validate-on="['submit']"
    :schema="forgotPasswordFormSchema"
    :state="stateSubmit"
    @submit="onSubmit"
  >
    <UFormGroup
      label="Email"
      name="email"
      class="mb-4"
    >
      <UInput
        v-model="stateSubmit.email"
        :disabled="isPendingForgetPassword"
        size="xl"
      />
    </UFormGroup>

    <UButton
      :loading="isPendingForgetPassword"
      size="xl"
      block
      type="submit"
      class="mt-6"
    >
      Continue
    </UButton>
  </UForm>
</template>
