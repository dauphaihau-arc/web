<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import { shopSchema } from '~/shared/schemas/shop.schema'
import type { Shop } from '~/shared/models/shop'
import { ROUTES } from '~/shared/config/enums/routes'
import { toastCustom } from '~/shared/config/toast'
import { useCreateShop } from '~/shared/server-state/shop/create-shop.mutation'

const toast = useToast()

const formRef = ref()
const unknownErrorMsg = ref('')

const stateSubmit = reactive({
  shop_name: '',
})

const {
  isPending: isPendingCreateShop,
  mutateAsync: createShop,
} = useCreateShop()

async function onSubmit(event: FormSubmitEvent<{ shop_name: Shop['shop_name'] }>) {
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
      :schema="shopSchema.pick({ shop_name: true })"
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

      <UButton
        :disabled="!stateSubmit.shop_name"
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
