<script setup lang="ts">
import { useForgetPassword } from '~/services/auth'
import { toastCustom } from '~/config/toast'
import { RESET_PASSWORD_VIEWS } from '~/config/enums/common'

const emit = defineEmits<{
  changeView: [value: RESET_PASSWORD_VIEWS]
}>()

const toast = useToast()
const authStore = useAuthStore()

const isResendEmail = ref(false)

const {
  mutateAsync: resend,
  isPending: isPendingResend,
} = useForgetPassword()

async function resendEmail() {
  try {
    await resend(authStore.emailRequestForgetPassword)
    isResendEmail.value = true
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
  <div>
    <div v-if="!isResendEmail">
      <p class="font-light">
        Thanks! If
        <span class="font-medium">{{ authStore.emailRequestForgetPassword }}</span>
        matches an email we have on file,
        then we've sent you an email
        containing further instructions for resetting your password.
      </p>
      <p class="font-light">
        If you haven't received an email in 5 minutes, check your spam,
        <UButton
          variant="link"
          class="font-base p-0"
          :disabled="isPendingResend"
          @click="resendEmail"
        >
          resend
        </UButton>, or
        <UButton
          variant="link"
          class="font-base p-0"
          @click="emit('changeView', RESET_PASSWORD_VIEWS.SEND_EMAIL)"
        >
          try a different email
        </UButton>
        .
      </p>
    </div>
    <div v-else>
      <p class="font-light">
        We've resent password reset instructions to
        <span class="font-medium">{{ authStore.emailRequestForgetPassword }}</span>
        if it is an email on file.
      </p>
      <p class="text-base font-light">
        Please check again. If you still haven't received an email
        <UButton
          variant="link"
          class="p-0 text-base"
          @click="emit('changeView', RESET_PASSWORD_VIEWS.SEND_EMAIL)"
        >
          try a different email
        </UButton>
        .
      </p>
    </div>
  </div>
</template>
