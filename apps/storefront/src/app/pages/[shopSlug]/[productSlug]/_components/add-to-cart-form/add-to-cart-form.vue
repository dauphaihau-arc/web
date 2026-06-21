<script setup lang="ts">
import { ProductVariantTypes } from '@arc/enums/product'
import { useAddToCartForm } from './use-add-to-cart-form'
import type { FormSubmitEvent } from '#ui/types'
import type { AddProductToCartRequest, AddProductToCartResponse } from '~/shared/api/cart/contracts/cart.contract'
import type { GetDetailProductBySlugResponse } from '~/shared/api/product/contracts/product.contract'
import { routes } from '~/shared/navigation/routes'
import { toastCustom } from '~/shared/config/toast'
import { useAddProductToCart } from '~/shared/server-state/cart/add-product.mutation'

type Inventory = GetDetailProductBySlugResponse['inventory'][number]
type AddToCartProduct = Pick<
  GetDetailProductBySlugResponse,
  'inventory' | 'variant_type' | 'variant_group_name' | 'variant_sub_group_name'
>

const props = defineProps<{
  product?: GetDetailProductBySlugResponse
  isLoading?: boolean
}>()

const inventorySelectedModel = defineModel<Inventory>('inventorySelected')

const queryClient = useQueryClient()
const toast = useToast()

const {
  mutateAsync: addProductToCart,
  isPending: isPendingAddProductToCart,
} = useAddProductToCart()

const formRef = ref()

const state = reactive({
  isBuyNow: false,
})

const fallbackProduct: AddToCartProduct = {
  inventory: [],
  variant_type: ProductVariantTypes.NONE,
  variant_group_name: '',
  variant_sub_group_name: '',
}

const product = computed<AddToCartProduct>(() => props.product ?? fallbackProduct)

const {
  decreaseQty,
  increaseQty,
  isOutOfStock,
  maxQuantity,
  resolvedInventorySelected,
  stateSubmit,
  subVariantOptions,
  validateForm,
  variantOptions,
} = useAddToCartForm({
  product,
  inventorySelectedModel,
})

async function onSubmit(event: FormSubmitEvent<{ quantity: number }>) {
  formRef.value.clear()
  const isBuyNow = state.isBuyNow
  state.isBuyNow = false

  if (!props.product || !resolvedInventorySelected.value?.id) {
    return
  }

  if (resolvedInventorySelected.value.stock <= 0) {
    toast.add({
      ...toastCustom.error,
      title: 'Out of stock',
    })
    return
  }

  const body: AddProductToCartRequest = {
    inventory_id: resolvedInventorySelected.value.id,
    quantity: event.data.quantity,
  }

  if (isBuyNow) {
    body.is_temp = true
    const response = await addProductToCart(body)

    if (response.cart === null || !response.cart?.id) {
      toast.add({
        ...toastCustom.error,
        title: 'Checkout failed',
      })
      return
    }

    queryClient.setQueryData<AddProductToCartResponse>(['get-cart', response.cart.id], response)
    navigateTo(routes.checkout({ c: response.cart.id }))
    return
  }

  const response = await addProductToCart(body)

  if (response.cart === null) {
    toast.add({
      ...toastCustom.error,
      title: 'Add product to cart failed',
    })
    return
  }

  queryClient.setQueryData<AddProductToCartResponse>(['get-cart', 'my-cart'], response)
  toast.add({
    ...toastCustom.success,
    title: 'Added to cart',
  })
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
      <USkeleton class="h-5 w-24 !bg-customGray-300/85" />
      <USkeleton class="h-11 w-full rounded-xl !bg-customGray-300/85" />
      <USkeleton class="h-5 w-20 !bg-customGray-300/85" />
      <USkeleton class="h-11 w-full rounded-xl !bg-customGray-300/85" />
      <USkeleton class="h-11 w-full rounded-xl !bg-customGray-300/85" />
    </div>

    <div class="flex gap-4">
      <USkeleton class="h-12 w-32 rounded-xl !bg-customGray-300/85" />
      <USkeleton class="h-12 w-32 rounded-xl !bg-customGray-300/85" />
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
        v-if="product.variant_type === ProductVariantTypes.SINGLE
          || product.variant_type === ProductVariantTypes.COMBINE"
        :label="product.variant_group_name"
        name="variantOption"
      >
        <USelectMenu
          v-model="stateSubmit.variantOption"
          :placeholder="`Select a ${product.variant_group_name}`"
          size="lg"
          :options="variantOptions"
        />
      </UFormGroup>

      <UFormGroup
        v-if="product.variant_type === ProductVariantTypes.COMBINE"
        :label="product.variant_sub_group_name"
        name="variantSubOption"
      >
        <USelectMenu
          v-model="stateSubmit.variantSubOption"
          :placeholder="`Select a ${product.variant_sub_group_name}`"
          size="lg"
          :options="subVariantOptions"
        />
      </UFormGroup>

      <div>
        <label class="mb-1 block text-sm font-medium text-text-subtle">
          Quantity
        </label>
        <UButtonGroup
          size="lg"
          orientation="horizontal"
        >
          <UButton
            icon="i-heroicons-minus"
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
            icon="i-heroicons-plus"
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
        Add to cart
      </UButton>
      <UButton
        size="xl"
        type="submit"
        :disabled="isPendingAddProductToCart || isOutOfStock"
        @click="state.isBuyNow = true"
      >
        Buy it now
      </UButton>
    </div>
  </UForm>
</template>
