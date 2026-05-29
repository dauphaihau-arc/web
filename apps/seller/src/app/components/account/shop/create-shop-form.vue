<script setup lang="ts">
import { MarketCurrencies } from '@arc/enums/market'
import { shopSchema } from '@arc/schemas/shop.schema'
import { currencyOptions } from '@arc/utils'
import type { FormSubmitEvent } from '#ui/types'
import type { CreateShopRequest } from '~/shared/api/shop/contracts/shop.contract'
import { ROUTES } from '~/shared/config/enums/routes'
import { toastCustom } from '~/shared/config/toast'
import { useCreateShop } from '~/shared/server-state/shop/create-shop.mutation'

const toast = useToast()

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
  <UCard
    :ui="{
      body: {
        padding: 'md:px-14 md:py-12',
      },
    }"
    class="mx-auto mt-12 max-w-[500px]"
  >
    <h1 class="mb-3 text-center text-2xl font-bold">
      Name your shop
    </h1>
    <p class="mb-4">
      Don’t sweat it! You can just draft a name now and change it later. We find
      sellers often draw inspiration from
      what
      they sell, their style, pretty much anything goes.
    </p>

    <UAlert
      v-if="unknownErrorMsg"
      color="rose"
      variant="solid"
      :close-button="{
        icon: 'i-heroicons-x-mark-20-solid', color: 'white', variant: 'link', padded: false,
      }"
      title=""
      :description="unknownErrorMsg"
      class="mb-4"
      @close="unknownErrorMsg=''"
    />
    <UForm
      ref="formRef"
      :validate-on="['submit']"
      :schema="shopSchema.pick({ shop_name: true, currency: true })"
      :state="stateSubmit"
      @submit="onSubmit"
    >
      <UFormGroup
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
            <div class="flex w-full items-center gap-3 py-1">
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
  </UCard>
</template>
