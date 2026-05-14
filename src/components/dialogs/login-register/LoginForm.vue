<script setup lang="ts">
import { StatusCodes } from 'http-status-codes'
import { FetchError } from 'ofetch'
import type { FormSubmitEvent } from '#ui/types'
import { userSchema } from '~/schemas/user.schema'
import type { User } from '~/types/user'
import { ROUTES } from '~/config/enums/routes'
import { useLogin } from '~/services/auth'
import type { LoginBody } from '~/types/auth'

const formRef = ref()
const unknownErrorServerMsg = ref('')
const invalidUsers = new Map<User['email'], User['password'][]>()
const stateSubmit: Partial<LoginBody> = reactive({})

const {
  mutateAsync: login,
  isPending: isPendingLogin,
} = useLogin()

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
        :schema="userSchema.pick({ email: true, password: true })"
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
          :loading="isPendingLogin"
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
