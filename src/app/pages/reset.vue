<script lang="ts" setup>
import { StatusCodes } from 'http-status-codes'
import { ROUTES } from '~/config/enums/routes'
import { useVerifyToken } from '~/services/auth'
import { RESET_PASSWORD_VIEWS } from '~/config/enums/common'

definePageMeta({ layout: 'market' })

const route = useRoute()
const authStore = useAuthStore()
const token = route.query?.t as string

useVerifyToken(token, {
  onResponse({ response }) {
    if (response.status === StatusCodes.OK) {
      authStore.tokenResetPassword = token
      navigateTo('/reset?v=1')
      currentView.value = RESET_PASSWORD_VIEWS.RESET_PASSWORD
    }
    else {
      currentView.value = RESET_PASSWORD_VIEWS.TOKEN_INVALID
    }
  },
})

const currentView = ref(token ? '' : RESET_PASSWORD_VIEWS.SEND_EMAIL)

const changeView = (step: RESET_PASSWORD_VIEWS) => {
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
    <ResetPasswordCard v-if="currentView === RESET_PASSWORD_VIEWS.SEND_EMAIL">
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
    <ResetPasswordCard v-if="currentView === RESET_PASSWORD_VIEWS.SEND_EMAIL_SUCCESS">
      <template #title>
        Check your email
      </template>
      <template #content>
        <SendEmailSuccess @change-view="changeView" />
      </template>
    </ResetPasswordCard>

    <!--  Token invalid -->
    <ResetPasswordCard v-if="currentView === RESET_PASSWORD_VIEWS.TOKEN_INVALID">
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
            @click="currentView = RESET_PASSWORD_VIEWS.SEND_EMAIL"
          >
            Try resetting your password again.
          </UButton>
        </div>
      </template>
    </ResetPasswordCard>

    <ResetPasswordForm v-if="currentView === RESET_PASSWORD_VIEWS.RESET_PASSWORD" />
  </div>
</template>
