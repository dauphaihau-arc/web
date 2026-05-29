<script setup lang="ts">
import { MarketCurrencies } from '@arc/enums/market'
import { StatusCodes } from 'http-status-codes'
import { FetchError } from 'ofetch'
import { currencyOptions } from '@arc/utils'
import type { FormError, FormSubmitEvent } from '#ui/types'
import { useAuthClientConfig } from '~/shared/server-state/auth/client-config.query'
import { useRegister } from '~/shared/server-state/auth/register.mutation'
import type { RegisterRequest as RegisterBody } from '~/shared/api/auth/contracts/register.contract'
import { registerFormSchema } from '~/shared/schemas/api/auth/register.schema'
import { appendPasswordError } from '~/shared/utils/password-policy'

const invalidEmails: string[] = []
const formRef = ref()
const unknownErrorServerMsg = ref('')
const stateSubmit = reactive<RegisterBody>({
  display_name: '',
  email: '',
  password: '',
  shop_name: '',
  currency: MarketCurrencies.USD,
})

const {
  mutateAsync: register,
  isPending: isPendingRegister,
} = useRegister()
const { data: authClientConfig, isLoading: isLoadingAuthClientConfig } = useAuthClientConfig()

const validateForm = (stateValidate: RegisterBody): FormError[] => {
  const errors: FormError[] = []

  const parsed = registerFormSchema.safeParse(stateValidate)
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
    formRef.value.setErrors([{ path: 'email', message: 'Email already taken' }])
    return
  }

  try {
    await register(event.data)
  }
  catch (error) {
    if (error instanceof FetchError) {
      if (error.status === StatusCodes.CONFLICT) {
        const errorMessage = String((error.data as { message?: string } | undefined)?.message ?? '')

        if (errorMessage.toLowerCase().includes('email')) {
          formRef.value.setErrors([{ path: 'email', message: 'Email already taken' }])
          invalidEmails.push(event.data.email)
          return
        }

        if (errorMessage.toLowerCase().includes('shop')) {
          formRef.value.setErrors([{ path: 'shop_name', message: 'Shop name already taken' }])
          return
        }

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
          class="mb-4"
        >
          <UInput
            v-model="stateSubmit.password"
            :disabled="isPendingRegister"
            size="xl"
            type="password"
          />
        </UFormGroup>

        <UFormGroup
          label="Shop name"
          name="shop_name"
          class="mb-4"
        >
          <UInput
            v-model="stateSubmit.shop_name"
            :disabled="isPendingRegister"
            size="xl"
          />
        </UFormGroup>

        <UFormGroup
          label="Currency"
          name="currency"
          class="mb-4"
        >
          <USelectMenu
            v-model="stateSubmit.currency"
            searchable
            :disabled="isPendingRegister"
            :options="currencyOptions"
            value-attribute="id"
            option-attribute="displayLabel"
            size="xl"
            :ui-menu="{
              select: '!normal-case',
              option: { base: '!normal-case', container: 'w-full' },
            }"
          >
            <template #label="{ option }">
              <div
                v-if="option"
                class="flex items-center gap-3"
              >
                <span class="min-w-10 text-sm font-semibold text-slate-950">
                  {{ option.symbol }}
                </span>
                <span class="truncate text-sm text-slate-600">
                  {{ option.label }}
                </span>
              </div>
            </template>
            <template #option="{ option }">
              <div class="flex w-full items-center gap-1 py-1">
                <span class="min-w-10 text-sm font-semibold text-slate-950">
                  {{ option.symbol }}
                </span>
                <span class="truncate text-sm text-slate-600">
                  {{ option.label }}
                </span>
              </div>
            </template>
          </USelectMenu>
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
