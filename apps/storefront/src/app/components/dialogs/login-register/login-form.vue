<script setup lang="ts">
import { StatusCodes } from 'http-status-codes'
import { FetchError } from 'ofetch'
import { loginFormSchema } from '@arc/schemas/forms/auth/login-form.schema'
import type { FormError, FormSubmitEvent } from '#ui/types'
import { ROUTES } from '~/shared/config/enums/routes'
import { useAuthClientConfig } from '~/shared/server-state/auth/client-config.query'
import { useLogin } from '~/shared/server-state/auth/login.mutation'
import type { LoginRequest as LoginBody } from '~/shared/api/auth/contracts/login.contract'
import { appendPasswordError } from '~/shared/utils/password-policy'

const formRef = ref()
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

  return errors
}

async function onSubmit(event: FormSubmitEvent<LoginBody>) {
  const { email, password } = event.data
  const invalidUser = invalidUsers.get(email)
  if (invalidUser && invalidUser.includes(password)) {
    unknownErrorServerMsg.value = 'Incorrect email or password'
    return
  }

  try {
    await login(event.data)
  }
  catch (error) {
    if (error instanceof FetchError) {
      if (error.status === StatusCodes.UNAUTHORIZED) {
        invalidUser ? invalidUser.push(password) : invalidUsers.set(email, [password])
        unknownErrorServerMsg.value = 'Incorrect email or password'
        return
      }
      unknownErrorServerMsg.value = 'An unknown error occurred. Please try again'
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
        ref="formRef"
        :validate-on="['submit']"
        :validate="validateForm"
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
            size="xl"
          />
        </UFormGroup>

        <UFormGroup
          label="Password"
          name="password"
          class="mb-2"
        >
          <UInput
            v-model="stateSubmit.password"
            size="xl"
            type="password"
          />
        </UFormGroup>

        <NuxtLink :to="ROUTES.RESET">
          <UButton
            variant="link"
            class="mb-4 pl-0"
          >
            Forget Password?
          </UButton>
        </NuxtLink>

        <UButton
          :loading="isPendingLogin || isLoadingAuthClientConfig"
          size="xl"
          block
          type="submit"
        >
          Log in
        </UButton>
      </UForm>
    </div>
  </div>
</template>
