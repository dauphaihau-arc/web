<script setup lang="ts">
import { StatusCodes } from 'http-status-codes'
import { FetchError } from 'ofetch'
import { loginFormSchema } from '@arc/schemas/forms/auth/login-form.schema'
import type { FormError, FormSubmitEvent } from '#ui/types'
import { ROUTES } from '~/shared/config/enums/routes'
import { useAuthClientConfig } from '~/domains/auth/queries/client-config.query'
import { useLogin } from '~/domains/auth/mutations/login.mutation'
import type { LoginRequest as LoginBody } from '~/domains/auth/api/contracts/login.contract'
import { appendPasswordError } from '~/domains/auth/utils/password-policy'
import { useLocalizedRoute } from '~/shared/composables/use-localized-route'
import { useAccountTranslator } from '~/domains/me/ui/account-i18n'
import { useErrorCopy } from '~/shared/composables/use-error-copy'
import { localizeFormErrors } from '~/domains/auth/utils/validation-message'

const t = useAccountTranslator()
const errorT = useErrorCopy()
const localizedRoute = (() => {
  try {
    return useLocalizedRoute()
  }
  catch {
    return null
  }
})()
const resetPath = computed(() => localizedRoute ? localizedRoute.localizePath(ROUTES.RESET) : ROUTES.RESET)
const unknownErrorServerMsg = ref('')
const invalidUsers = new Map<LoginBody['email'], LoginBody['password'][]>()
const stateSubmit: Partial<LoginBody> = reactive({})

const {
  mutateAsync: login,
  isPending: isPendingLogin,
} = useLogin()
const { data: authClientConfig, isLoading: isLoadingAuthClientConfig } = useAuthClientConfig()

const validateForm = (stateValidate: Partial<LoginBody>): FormError[] => {
  const errors: FormError[] = []

  const parsed = loginFormSchema.pick({ email: true }).safeParse(stateValidate)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const path = issue.path[0]
      if (typeof path === 'string') {
        errors.push({ path, message: issue.message })
      }
    }
  }

  appendPasswordError(errors, 'password', stateValidate.password, authClientConfig.value)

  return localizeFormErrors(errors, errorT)
}

async function onSubmit(event: FormSubmitEvent<LoginBody>) {
  const { email, password } = event.data
  const invalidUser = invalidUsers.get(email)
  if (invalidUser && invalidUser.includes(password)) {
    unknownErrorServerMsg.value = t('account.auth.login.incorrect')
    return
  }

  try {
    await login(event.data)
  }
  catch (error) {
    if (error instanceof FetchError) {
      if (error.status === StatusCodes.UNAUTHORIZED) {
        if (invalidUser) {
          invalidUser.push(password)
        }
        else {
          invalidUsers.set(email, [password])
        }
        unknownErrorServerMsg.value = t('account.auth.login.incorrect')
        return
      }
      if (error.status === StatusCodes.FORBIDDEN) {
        unknownErrorServerMsg.value = t('account.auth.login.forbidden')
        return
      }
      unknownErrorServerMsg.value = t('account.auth.login.genericError')
    }
  }
}
</script>

<template>
  <div class="space-y-5">
    <UAlert
      v-if="unknownErrorServerMsg"
      color="rose"
      variant="solid"
      :close-button="{
        icon: 'i-heroicons-x-mark-20-solid', color: 'white', variant: 'link', padded: false,
      }"
      title=""
      :description="unknownErrorServerMsg"
      :ui="{ description: 'mt-[2px]' }"
      @close="unknownErrorServerMsg=''"
    />

    <div class="rounded">
      <UForm
        :validate-on="['submit']"
        :validate="validateForm"
        :state="stateSubmit"
        @submit="onSubmit"
      >
        <UFormGroup
          :label="t('account.auth.login.email')"
          name="email"
          class="mb-4"
        >
          <UInput
            v-model="stateSubmit.email"
            :disabled="isPendingLogin"
            size="xl"
          />
        </UFormGroup>

        <UFormGroup
          :label="t('account.auth.login.password')"
          name="password"
          class="mb-2"
        >
          <UInput
            v-model="stateSubmit.password"
            :disabled="isPendingLogin"
            size="xl"
            type="password"
          />
        </UFormGroup>

        <NuxtLink
          :to="resetPath"
          :aria-disabled="isPendingLogin || undefined"
          :tabindex="isPendingLogin ? -1 : undefined"
          class="aria-disabled:pointer-events-none aria-disabled:opacity-50"
        >
          <UButton
            variant="link"
            class="mb-4 pl-0"
          >
            {{ t('account.auth.login.forgot') }}
          </UButton>
        </NuxtLink>

        <UButton
          data-testid="login-submit"
          :loading="isPendingLogin"
          :disabled="isLoadingAuthClientConfig"
          size="xl"
          block
          type="submit"
        >
          {{ t('account.auth.login.submit') }}
        </UButton>
      </UForm>
    </div>
  </div>
</template>
