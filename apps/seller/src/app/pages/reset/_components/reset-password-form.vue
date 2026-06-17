<script setup lang="ts">
import { resetPasswordFormSchema } from '@arc/schemas/forms/auth/reset-password-form.schema'
import ResetPasswordShell from '@arc/ui/shells/auth/reset-password-shell.vue'
import type { FormError, FormSubmitEvent } from '#ui/types'
import type { ResetPasswordForm as ResetPasswordBody } from '~/shared/api/auth/contracts/reset-password.contract'
import { routes } from '~/shared/navigation/routes'
import { useAuthClientConfig } from '~/shared/server-state/auth/client-config.query'
import { useResetPassword } from '~/shared/server-state/auth/reset-password.mutation'
import { appendPasswordError } from '~/shared/utils/password-policy'

const authStore = useAuthStore()

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
    unknownErrorServerMsg.value = 'An unknown error occurred. Please try again'
  }
}
</script>

<template>
  <div>
    <ResetPasswordShell v-if="!resetPasswordSuccess">
      <template #title>
        Reset your password
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
              label="New password"
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
              label="Confirm your password"
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
              :loading="isPendingResetPassword || isLoadingAuthClientConfig"
              size="xl"
              block
              type="submit"
            >
              Save
            </UButton>
          </UForm>
        </div>
      </template>
    </ResetPasswordShell>

    <ResetPasswordShell v-else>
      <template #title>
        You've successfully changed your password
      </template>
      <template #content>
        <NuxtLink :to="routes.products()">
          <UButton
            size="xl"
            block
          >
            Go to dashboard
          </UButton>
        </NuxtLink>
      </template>
    </ResetPasswordShell>
  </div>
</template>
