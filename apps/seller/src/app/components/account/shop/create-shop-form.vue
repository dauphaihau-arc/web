<script setup lang="ts">
import { MarketCurrencies } from '@arc/enums/market'
import { currencyOptions } from '@arc/utils'
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import type { CreateShopRequest } from '~/shared/api/shop/contracts/shop.contract'
import { ROUTES } from '~/shared/config/enums/routes'
import { toastCustom } from '~/shared/config/toast'
import { useCreateShop } from '~/shared/server-state/shop/create-shop.mutation'

const toast = useToast()

const createShopFormSchema = z.object({
  shop_name: z.string().trim().min(6).max(20),
  currency: z.nativeEnum(MarketCurrencies),
})

const formRef = ref()
const unknownErrorMsg = ref('')

const stateSubmit = reactive({
  shop_name: '',
  currency: MarketCurrencies.USD,
})

const {
  isPending: isPendingCreateShop,
  mutateAsync: createShop,
} = useCreateShop()

async function onSubmit(event: FormSubmitEvent<CreateShopRequest>) {
  formRef.value.clear()
  try {
    await createShop(event.data)
    toast.add({
      ...toastCustom.success,
      title: 'Create shop success',
    })
    navigateTo(`${ROUTES.ACCOUNT}${ROUTES.SHOP}${ROUTES.DASHBOARD}`)
  }
  catch (error) {
    toast.add({
      ...toastCustom.error,
      title: 'Unknown error from server',
    })
  }
}
</script>

<template>
  <div class="space-y-5">
    <UAlert
      v-if="unknownErrorMsg"
      color="rose"
      variant="solid"
      :close-button="{
        icon: 'i-heroicons-x-mark-20-solid', color: 'white', variant: 'link', padded: false,
      }"
      title=""
      :description="unknownErrorMsg"
      :ui="{ description: 'mt-[2px]' }"
      @close="unknownErrorMsg=''"
    />

    <UForm
      ref="formRef"
      :validate-on="['submit']"
      :schema="createShopFormSchema"
      :state="stateSubmit"
      @submit="onSubmit"
    >
      <UFormGroup
        label="Shop name"
        name="shop_name"
        class="mb-4"
      >
        <UInput
          v-model="stateSubmit.shop_name"
          :disabled="isPendingCreateShop"
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
          :disabled="isPendingCreateShop"
          :options="currencyOptions"
          value-attribute="id"
          option-attribute="displayLabel"
          size="xl"
          :ui-menu="{
            select: '!normal-case',
            option: { base: '!normal-case' },
          }"
        />
      </UFormGroup>

      <UButton
        :disabled="!stateSubmit.shop_name || !stateSubmit.currency"
        :loading="isPendingCreateShop"
        size="xl"
        block
        type="submit"
        class="mt-6"
      >
        Continue
      </UButton>
    </UForm>
  </div>
</template>
