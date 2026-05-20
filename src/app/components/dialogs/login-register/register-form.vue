<script setup lang="ts">
import { FetchError } from 'ofetch'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import type { FormError, FormSubmitEvent } from '#ui/types'
import { userSchema } from '~/shared/schemas/user.schema'
import type { User } from '~/shared/types/user'
import { LocalStorageKeys } from '~/shared/config/enums/local-storage-keys'
import { useAuthClientConfig, useRegister } from '~/shared/server-state/auth'
import type { RegisterBody } from '~/shared/types/auth'
import { appendPasswordError } from '~/shared/utils/password-policy'

const invalidEmails: string[] = []
const formRef = ref()
const unknownErrorServerMsg = ref('')

const stateSubmit: Partial<RegisterBody> = reactive({})
const registerSchema = z.object({
  display_name: userSchema.shape.name,
  email: userSchema.shape.email,
})

const {
  mutateAsync: register,
  isPending: isPendingRegister,
} = useRegister()
const { data: authClientConfig, isLoading: isLoadingAuthClientConfig } = useAuthClientConfig()

const validateForm = (stateValidate: Partial<RegisterBody> & { display_name?: string }): FormError[] => {
  const errors: FormError[] = []

  const parsed = registerSchema.safeParse(stateValidate)
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

async function onSubmit(event: FormSubmitEvent<RegisterBody>) {
  formRef.value.clear()
  if (invalidEmails.includes(event.data.email)) {
    formRef.value.setErrors([{ path: 'email', message: 'Invalid email' }])
    return
  }

  const userPreferences = parseJSON<User['market_preferences']>(localStorage[LocalStorageKeys.GUEST_PREFERENCES])

  try {
    await register({
      ...event.data,
      preferences: userPreferences,
    })
  }
  catch (error) {
    if (error instanceof FetchError) {
      if (error.status === StatusCodes.CONFLICT) {
        formRef.value.setErrors([{ path: 'email', message: 'Email already taken' }])
        invalidEmails.push(event.data.email)
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
        icon: 'i-heroicons-x-mark-20-solid',
        color: 'white',
        variant: 'link',
        padded: false,
      }"
      title=""
      :ui="{ description: 'mt-[2px]' }"
      :description="unknownErrorServerMsg"
      @close="unknownErrorServerMsg = ''"
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
          label="Name"
          name="display_name"
          class="mb-4"
        >
          <UInput
            v-model="stateSubmit.display_name"
            :disabled="isPendingRegister"
            size="xl"
          />
        </UFormGroup>

        <UFormGroup
          label="Email"
          name="email"
          class="mb-4"
        >
          <UInput
            v-model="stateSubmit.email"
            :disabled="isPendingRegister"
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
            :disabled="isPendingRegister"
            size="xl"
            type="password"
          />
        </UFormGroup>

        <UButton
          :loading="isPendingRegister || isLoadingAuthClientConfig"
          size="xl"
          block
          type="submit"
          class="mt-8"
        >
          Register
        </UButton>
      </UForm>
    </div>
  </div>
</template>
