<script setup lang="ts">
import { ResetPasswordViews } from '@arc/enums/common'
import { useForgetPassword } from '~/domains/auth/mutations/forgot-password.mutation'
import { toastCustom } from '~/shared/config/toast'

const emit = defineEmits<{
  changeView: [value: ResetPasswordViews]
}>()

const { t } = useI18n()
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
  catch {
    toast.add({
      ...toastCustom.error,
      title: t('account.reset.request.genericError'),
    })
  }
}
</script>

<template>
  <div>
    <div v-if="!isResendEmail">
      <p class="font-light">
        {{ $t('account.reset.sent.messagePrefix') }}
        <span class="font-medium">{{ authStore.emailRequestForgetPassword }}</span>
        {{ $t('account.reset.sent.messageSuffix') }}
      </p>
      <p class="font-light">
        {{ $t('account.reset.sent.helpPrefix') }}
        <UButton
          variant="link"
          class="font-base p-0"
          :disabled="isPendingResend"
          @click="resendEmail"
        >
          {{ $t('account.reset.sent.resend') }}
        </UButton>{{ $t('account.reset.sent.helpOr') }}
        <UButton
          variant="link"
          class="font-base p-0"
          @click="emit('changeView', ResetPasswordViews.SEND_EMAIL)"
        >
          {{ $t('account.reset.sent.differentEmail') }}
        </UButton>.
      </p>
    </div>
    <div v-else>
      <p class="font-light">
        {{ $t('account.reset.sent.resentPrefix') }}
        <span class="font-medium">{{ authStore.emailRequestForgetPassword }}</span>
        {{ $t('account.reset.sent.resentSuffix') }}
      </p>
      <p class="text-base font-light">
        {{ $t('account.reset.sent.checkAgain') }}
        <UButton
          variant="link"
          class="p-0 text-base"
          @click="emit('changeView', ResetPasswordViews.SEND_EMAIL)"
        >
          {{ $t('account.reset.sent.tryDifferentEmail') }}
        </UButton>.
      </p>
    </div>
  </div>
</template>
