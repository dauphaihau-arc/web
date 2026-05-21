<script lang="ts" setup>
import { StatusCodes } from 'http-status-codes'
import ForgetPasswordForm from '~/app/components/reset/forget-password-form.vue'
import ResetPasswordCard from '~/app/components/reset/reset-password-card.vue'
import ResetPasswordForm from '~/app/components/reset/reset-password-form.vue'
import SendEmailSuccess from '~/app/components/reset/send-email-success.vue'
import { routes } from '~/shared/navigation/routes'
import { useVerifyToken } from '~/shared/server-state/auth/verify-token.query'
import { ResetPasswordViews } from '~/shared/config/enums/common'

definePageMeta({ layout: 'market' })

const route = useRoute()
const authStore = useAuthStore()
const token = route.query?.t as string

useVerifyToken(token, {
  onResponse({ response }) {
    if (response.status === StatusCodes.OK) {
      authStore.tokenResetPassword = token
      navigateTo(routes.reset({ v: 1 }))
      currentView.value = ResetPasswordViews.RESET_PASSWORD
    }
    else {
      currentView.value = ResetPasswordViews.TOKEN_INVALID
    }
  },
})

const currentView = ref(token ? '' : ResetPasswordViews.SEND_EMAIL)

const changeView = (step: ResetPasswordViews) => {
  currentView.value = step
}

onMounted(() => {
  if (route.query?.v) {
    navigateTo(routes.reset())
  }
})
</script>

<template>
  <div class="mx-auto mt-12 max-w-lg">
    <!--    Send email -->
    <ResetPasswordCard v-if="currentView === ResetPasswordViews.SEND_EMAIL">
      <template #title>
        Reset your password
      </template>
      <template #subtitle>
        Enter the email address associated with
        your account and we'll send you a link to reset your password.
      </template>
      <template #content>
        <ForgetPasswordForm @change-view="changeView" />
      </template>
    </ResetPasswordCard>

    <!--  Send email success -->
    <ResetPasswordCard v-if="currentView === ResetPasswordViews.SEND_EMAIL_SUCCESS">
      <template #title>
        Check your email
      </template>
      <template #content>
        <SendEmailSuccess @change-view="changeView" />
      </template>
    </ResetPasswordCard>

    <!--  Token invalid -->
    <ResetPasswordCard v-if="currentView === ResetPasswordViews.TOKEN_INVALID">
      <template #content>
        <div class="flex flex-col items-center justify-center">
          <AppIcon
            name="warning"
            class="mb-3 size-7 text-black"
          />
          <div>
            This password reset link has expired.
          </div>
          <UButton
            variant="link"
            @click="currentView = ResetPasswordViews.SEND_EMAIL"
          >
            Try resetting your password again.
          </UButton>
        </div>
      </template>
    </ResetPasswordCard>

    <ResetPasswordForm v-if="currentView === ResetPasswordViews.RESET_PASSWORD" />
  </div>
</template>
