<script lang="ts" setup>
import { StatusCodes } from 'http-status-codes'
import AppIcon from '@arc/ui/primitives/app-icon.vue'
import ResetPasswordShell from '@arc/ui/shells/auth/reset-password-shell.vue'
import { ResetPasswordViews } from '@arc/enums/common'
import ForgetPasswordForm from './_components/forget-password-form.vue'
import ResetPasswordForm from './_components/reset-password-form.vue'
import SendEmailSuccess from './_components/send-email-success.vue'
import { routes } from '~/shared/navigation/routes'
import { useLocalizedRoute } from '~/shared/composables/use-localized-route'
import { useVerifyToken } from '~/domains/auth/queries/verify-token.query'

definePageMeta({ layout: 'market' })

usePageSeo({ area: 'auth' })

const route = useRoute()
const authStore = useAuthStore()
const { localizePath } = useLocalizedRoute()
const token = route.query?.t as string

useVerifyToken(token, {
  onResponse({ response }) {
    if (response.status === StatusCodes.OK) {
      authStore.tokenResetPassword = token
      navigateTo(localizePath(routes.reset({ v: 1 })))
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
    navigateTo(localizePath(routes.reset()))
  }
})
</script>

<template>
  <div class="mx-auto mt-12 max-w-lg px-4 md:px-12 lg:px-16">
    <!--    Send email -->
    <ResetPasswordShell v-if="currentView === ResetPasswordViews.SEND_EMAIL">
      <template #title>
        {{ $t('account.reset.request.title') }}
      </template>
      <template #subtitle>
        {{ $t('account.reset.request.subtitle') }}
      </template>
      <template #content>
        <ForgetPasswordForm @change-view="changeView" />
      </template>
    </ResetPasswordShell>

    <!--  Send email success -->
    <ResetPasswordShell v-if="currentView === ResetPasswordViews.SEND_EMAIL_SUCCESS">
      <template #title>
        {{ $t('account.reset.sent.title') }}
      </template>
      <template #content>
        <SendEmailSuccess @change-view="changeView" />
      </template>
    </ResetPasswordShell>

    <!--  Token invalid -->
    <ResetPasswordShell v-if="currentView === ResetPasswordViews.TOKEN_INVALID">
      <template #content>
        <div class="flex flex-col items-center justify-center">
          <AppIcon
            name="warning"
            class="mb-3 size-7 text-black"
          />
          <div>
            {{ $t('account.reset.expired.message') }}
          </div>
          <UButton
            variant="link"
            @click="currentView = ResetPasswordViews.SEND_EMAIL"
          >
            {{ $t('account.reset.expired.retry') }}
          </UButton>
        </div>
      </template>
    </ResetPasswordShell>

    <ResetPasswordForm v-if="currentView === ResetPasswordViews.RESET_PASSWORD" />
  </div>
</template>
