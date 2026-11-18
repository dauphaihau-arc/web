<script setup lang="ts">
import { useAddToCartForm } from './use-add-to-cart-form'
import type { FormSubmitEvent } from '#ui/types'
import type { GetDetailProductBySlugResponse } from '~/domains/product/api/contracts/product.contract'
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'

type Inventory = GetDetailProductBySlugResponse['inventory'][number]
type AddToCartProduct = Pick<
  GetDetailProductBySlugResponse,
  'inventory' | 'options' | 'variants'
>

const props = defineProps<{
  product?: GetDetailProductBySlugResponse
  isLoading?: boolean
}>()

const inventorySelectedModel = defineModel<Inventory>('inventorySelected')

const formRef = ref()
const { t } = useI18n()

const state = reactive({
  isBuyNow: false,
})

const fallbackProduct: AddToCartProduct = {
  inventory: [],
  options: [],
  variants: [],
}

const product = computed<AddToCartProduct>(() => props.product ?? fallbackProduct)

const {
  decreaseQty,
  increaseQty,
  isOutOfStock,
  isPendingAddProductToCart,
  maxQuantity,
  stateSubmit,
  subVariantOptions,
  optionMode,
  submit,
  validateForm,
  variantOptions,
} = useAddToCartForm({
  product,
  inventorySelectedModel,
  translate: (key, named) => t(key, named ?? {}),
})

async function onSubmit(event: FormSubmitEvent<{ quantity: number }>) {
  formRef.value.clear()
  const isBuyNow = state.isBuyNow
  state.isBuyNow = false

  await submit({ quantity: event.data.quantity, isBuyNow })
}
</script>

<template>
  <div
    v-if="props.isLoading"
    class="space-y-4"
    aria-busy="true"
    aria-live="polite"
  >
    <div class="mb-6 flex w-1/3 min-w-[220px] flex-col gap-4">
      <USkeleton class="h-5 w-24 !bg-surface-skeleton" />
      <USkeleton class="h-11 w-full rounded-xl !bg-surface-skeleton" />
      <USkeleton class="h-5 w-20 !bg-surface-skeleton" />
      <USkeleton class="h-11 w-full rounded-xl !bg-surface-skeleton" />
      <USkeleton class="h-11 w-full rounded-xl !bg-surface-skeleton" />
    </div>

    <div class="flex gap-4">
      <USkeleton class="h-12 w-32 rounded-xl !bg-surface-skeleton" />
      <USkeleton class="h-12 w-32 rounded-xl !bg-surface-skeleton" />
    </div>
  </div>

  <UForm
    v-else
    ref="formRef"
    :validate-on="['submit']"
    class="space-y-4"
    :validate="validateForm"
    :state="stateSubmit"
    @submit="onSubmit"
  >
    <div class="mb-6 flex w-1/3 flex-col gap-4">
      <UFormGroup
        v-if="optionMode === 'single'
          || optionMode === 'combine'"
        :label="product.options[0]?.name"
        name="variantOption"
      >
        <USelectMenu
          v-model="stateSubmit.variantOption"
          :placeholder="$t('catalog.product.selectVariant', { name: product.options[0]?.name ?? $t('catalog.product.variant') })"
          size="lg"
          :options="variantOptions"
          value-attribute="value"
          option-attribute="label"
        />
      </UFormGroup>

      <UFormGroup
        v-if="optionMode === 'combine'"
        :label="product.options[1]?.name"
        name="variantSubOption"
      >
        <USelectMenu
          v-model="stateSubmit.variantSubOption"
          :placeholder="$t('catalog.product.selectVariant', { name: product.options[1]?.name ?? $t('catalog.product.variant') })"
          size="lg"
          :options="subVariantOptions"
          value-attribute="value"
          option-attribute="label"
        />
      </UFormGroup>

      <div>
        <label class="mb-1 block text-sm font-medium text-text-subtle">
          {{ $t('catalog.product.quantity') }}
        </label>
        <UButtonGroup
          size="lg"
          orientation="horizontal"
        >
          <UButton
            :icon="ICON_NAME_BY_ALIAS['minus']"
            color="white"
            class="rounded-l-md rounded-r-none"
            @click="decreaseQty"
          />
          <UInput
            v-model.number="stateSubmit.quantity"
            v-max-number="maxQuantity"
            v-numeric
            class="rounded-l-none"
            type="number"
            :ui="{ base: ' text-center rounded-l-none' }"
          />
          <UButton
            :icon="ICON_NAME_BY_ALIAS['plus']"
            color="white"
            class="rounded-l-none rounded-r-md"
            @click="increaseQty"
          />
        </UButtonGroup>
      </div>
    </div>

    <div class="flex gap-4">
      <UButton
        size="xl"
        variant="subtle"
        type="submit"
        :disabled="isPendingAddProductToCart || isOutOfStock"
        @click="state.isBuyNow = false"
      >
        {{ $t('catalog.product.addToCart') }}
      </UButton>
      <UButton
        size="xl"
        type="submit"
        :disabled="isPendingAddProductToCart || isOutOfStock"
        @click="state.isBuyNow = true"
      >
        {{ $t('catalog.product.buyNow') }}
      </UButton>
    </div>
  </UForm>
</template>
