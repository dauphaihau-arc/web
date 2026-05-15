<script lang="ts" setup>
import { StatusCodes } from 'http-status-codes'
import ForgetPasswordForm from '~/modules/pages/reset/forget-password-form.vue'
import ResetPasswordCard from '~/modules/pages/reset/reset-password-card.vue'
import ResetPasswordForm from '~/modules/pages/reset/reset-password-form.vue'
import SendEmailSuccess from '~/modules/pages/reset/send-email-success.vue'
import { ROUTES } from '~/shared/config/enums/routes'
import { useVerifyToken } from '~/shared/services/auth'
import { ResetPasswordViews } from '~/shared/config/enums/common'

definePageMeta({ layout: 'market' })

const route = useRoute()
const authStore = useAuthStore()
const token = route.query?.t as string

useVerifyToken(token, {
  onResponse({ response }) {
    if (response.status === StatusCodes.OK) {
      authStore.tokenResetPassword = token
      navigateTo('/reset?v=1')
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
    navigateTo(ROUTES.RESET)
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
          <Icon
            name="ph:warning-duotone"
            color="black"
            class="mb-3 size-7"
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
