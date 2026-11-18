<script setup lang="ts">
import { resetPasswordFormSchema } from '@arc/schemas/forms/auth/reset-password-form.schema'
import ResetPasswordShell from '@arc/ui/shells/auth/reset-password-shell.vue'
import type { FormError, FormSubmitEvent } from '#ui/types'
import { useAuthClientConfig } from '~/domains/auth/queries/client-config.query'
import { useResetPassword } from '~/domains/auth/mutations/reset-password.mutation'
import { ROUTES } from '~/shared/config/enums/routes'
import { useLocalizedRoute } from '~/shared/composables/use-localized-route'
import type { ResetPasswordForm as ResetPasswordBody } from '~/domains/auth/api/contracts/reset-password.contract'
import { appendPasswordError } from '~/domains/auth/utils/password-policy'

const authStore = useAuthStore()
const { t } = useI18n()
const { localizePath } = useLocalizedRoute()

const formRef = ref()
const resetPasswordSuccess = ref(false)
const unknownErrorServerMsg = ref('')

const stateSubmit: Partial<ResetPasswordBody> = reactive({})

const {
  mutateAsync: resetPassword,
  isPending: isPendingResetPassword,
} = useResetPassword(authStore.tokenResetPassword)
const { data: authClientConfig, isLoading: isLoadingAuthClientConfig } = useAuthClientConfig()

const validateForm = (stateValidate: Partial<ResetPasswordBody>): FormError[] => {
  const errors: FormError[] = []

  const parsed = resetPasswordFormSchema.pick({ passwordConfirm: true }).safeParse(stateValidate)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const path = issue.path[0]
      if (typeof path === 'string') {
        errors.push({ path, message: issue.message })
      }
    }
  }

  appendPasswordError(errors, 'password', stateValidate.password, authClientConfig.value)

  return errors
}

async function onSubmit(event: FormSubmitEvent<ResetPasswordBody>) {
  formRef.value.clear()
  const { password, passwordConfirm } = event.data
  if (password !== passwordConfirm) {
    formRef.value.setErrors([{ path: 'passwordConfirm', message: 'This password does not match. Try again.' }])
    return
  }

  try {
    await resetPassword(password)
    resetPasswordSuccess.value = true
  }
  catch {
    unknownErrorServerMsg.value = t('account.reset.form.genericError')
  }
}
</script>

<template>
  <div>
    <ResetPasswordShell v-if="!resetPasswordSuccess">
      <template #title>
        {{ $t('account.reset.form.title') }}
      </template>
      <template #content>
        <div class="space-y-5">
          <UAlert
            v-if="unknownErrorServerMsg"
            color="rose"
            variant="solid"
            :close-button="{
              icon: 'i-heroicons-x-mark-20-solid',
              color: 'white',
              variant: 'link',
              padded: false,
            }"
            title=""
            :description="unknownErrorServerMsg"
            @close="unknownErrorServerMsg=''"
          />

          <UForm
            ref="formRef"
            :validate-on="['submit']"
            :validate="validateForm"
            :state="stateSubmit"
            @submit="onSubmit"
          >
            <UFormGroup
              :label="$t('account.reset.form.newPassword')"
              name="password"
              class="mb-4"
            >
              <UInput
                v-model="stateSubmit.password"
                :disabled="isPendingResetPassword"
                size="xl"
                type="password"
              />
            </UFormGroup>
            <UFormGroup
              :label="$t('account.reset.form.confirmPassword')"
              name="passwordConfirm"
              class="mb-8"
            >
              <UInput
                v-model="stateSubmit.passwordConfirm"
                :disabled="isPendingResetPassword"
                size="xl"
                type="password"
              />
            </UFormGroup>

            <UButton
              :loading="isPendingResetPassword"
              :disabled="isLoadingAuthClientConfig"
              size="xl"
              block
              type="submit"
            >
              {{ $t('account.reset.form.save') }}
            </UButton>
          </UForm>
        </div>
      </template>
    </ResetPasswordShell>

    <ResetPasswordShell v-else>
      <template #title>
        {{ $t('account.reset.success.title') }}
      </template>
      <template #content>
        <NuxtLink :to="localizePath(ROUTES.HOME)">
          <UButton
            size="xl"
            block
          >
            {{ $t('account.reset.success.continue') }}
          </UButton>
        </NuxtLink>
      </template>
    </ResetPasswordShell>
  </div>
</template>
