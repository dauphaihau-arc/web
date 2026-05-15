<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import { userSchema } from '~/shared/schemas/user.schema'
import type { User } from '~/shared/types/user'
import { useForgetPassword } from '~/shared/services/auth'
import { RESET_PASSWORD_VIEWS } from '~/shared/config/enums/common'
import { toastCustom } from '~/shared/config/toast'

const emit = defineEmits<{
  changeView: [value: RESET_PASSWORD_VIEWS]
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

async function onSubmit(event: FormSubmitEvent<Pick<User, 'email'>>) {
  authStore.emailRequestForgetPassword = event.data.email
  try {
    await forgetPassword(event.data.email)
    emit('changeView', RESET_PASSWORD_VIEWS.SEND_EMAIL_SUCCESS)
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
    :schema="userSchema.pick({ email: true })"
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
