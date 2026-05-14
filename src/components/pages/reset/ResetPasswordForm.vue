<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import { userSchema } from '~/schemas/user.schema'
import { useResetPassword } from '~/services/auth'
import { ROUTES } from '~/config/enums/routes'
import type { ResetPasswordBody } from '~/types/auth'

const authStore = useAuthStore()

const formRef = ref()
const resetPasswordSuccess = ref(false)
const unknownErrorServerMsg = ref('')

const stateSubmit: Partial<ResetPasswordBody> = reactive({})

const {
  mutateAsync: resetPassword,
  isPending: isPendingResetPassword,
} = useResetPassword(authStore.tokenResetPassword)

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
  catch (error) {
    unknownErrorServerMsg.value = 'An unknown error occurred. Please try again'
  }
}
</script>

<template>
  <div>
    <ResetPasswordCard v-if="!resetPasswordSuccess">
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
            :schema="userSchema.pick({ password: true })"
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
              :loading="isPendingResetPassword"
              size="xl"
              block
              type="submit"
            >
              Save
            </UButton>
          </UForm>
        </div>
      </template>
    </ResetPasswordCard>

    <ResetPasswordCard v-else>
      <template #title>
        You've successfully changed your password
      </template>
      <template #content>
        <NuxtLink :to="ROUTES.HOME">
          <UButton
            size="xl"
            block
          >
            Continue to shopping
          </UButton>
        </NuxtLink>
      </template>
    </ResetPasswordCard>
  </div>
</template>
