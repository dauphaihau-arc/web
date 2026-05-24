<script setup lang="ts">
import { consola } from 'consola'
import { ProductVariantTypes } from '@arc/enums/product'
import type { FormError, FormSubmitEvent } from '#ui/types'
import type { AddProductToCartRequest, AddProductToCartResponse } from '~/shared/api/cart/contracts/cart.contract'
import { routes } from '~/shared/navigation/routes'
import { useAddProductToCart } from '~/shared/server-state/cart/add-product.mutation'
import type { GetDetailProductBySlugResponse } from '~/shared/api/product/contracts/product.contract'
import { toastCustom } from '~/shared/config/toast'

interface StateSubmit {
  quantity: number
  variantOption: string
  variantSubOption: string
}

type Inventory = GetDetailProductBySlugResponse['inventory'][number]

const props = defineProps<{
  product: GetDetailProductBySlugResponse
}>()
const { product } = props

const inventorySelectedModel = defineModel<Inventory>('inventorySelected')

const queryClient = useQueryClient()
const toast = useToast()

const {
  mutateAsync: addProductToCart,
  isPending: isPendingAddProductToCart,
} = useAddProductToCart()

// ------------- States
const formRef = ref()

const state = reactive({
  variantOpts: [] as string[],
  subVariantOpts: [] as string[],
  isBuyNow: false,
})

const stateSubmit = reactive<StateSubmit>({
  quantity: 1,
  variantOption: '',
  variantSubOption: '',
})

const maxQuantity = computed(() => {
  if (inventorySelectedModel.value) {
    return inventorySelectedModel.value.stock
  }
  return product.inventory.reduce((acc, inv) => acc + inv.stock, 0)
})

const variantNameById = new Map<string, string>()
const inventoriesMap = new Map<string, Inventory>()

// ------------- Lifecycle Hooks
onMounted(() => {
  product.variants.forEach((variant) => {
    variantNameById.set(variant.id, variant.name)
  })

  switch (product.variant_type) {
    case ProductVariantTypes.NONE:
      inventorySelectedModel.value = props.product.inventory[0]
      break
    case ProductVariantTypes.SINGLE:
      props.product.inventory.forEach((inv) => {
        const variant_name = inv.product_variant_id
          ? variantNameById.get(inv.product_variant_id)
          : undefined
        if (variant_name) {
          inventoriesMap.set(variant_name, inv)
          state.variantOpts.push(variant_name)
        }
      })
      break
    case ProductVariantTypes.COMBINE: {
      props.product.inventory.forEach((inv) => {
        const variant_name = inv.product_variant_id
          ? variantNameById.get(inv.product_variant_id)
          : undefined
        if (variant_name) {
          inventoriesMap.set(variant_name, inv)
          const [primaryVariantName, subVariantName] = variant_name.split(' / ')
          if (!state.variantOpts.includes(primaryVariantName)) {
            state.variantOpts.push(primaryVariantName)
          }
          if (subVariantName && !state.subVariantOpts.includes(subVariantName)) {
            state.subVariantOpts.push(subVariantName)
          }
        }
      })
    }
      break
  }
})

// ------------- Features
const decreaseQty = () => {
  if (stateSubmit.quantity === 1) return
  stateSubmit.quantity--
}

const validateForm = (stateValidate: StateSubmit): FormError[] => {
  const errors: FormError[] = []

  if (product.variant_type !== ProductVariantTypes.NONE) {
    if (!stateValidate.variantOption) {
      errors.push({
        path: 'variantOption',
        message: 'Required',
      })
    }

    if (product.variant_type === ProductVariantTypes.COMBINE && !stateValidate.variantSubOption) {
      errors.push({
        path: 'variantSubOption',
        message: 'Required',
      })
    }
  }
  return errors
}

async function onSubmit(event: FormSubmitEvent<StateSubmit>) {
  formRef.value.clear()
  const isBuyNow = state.isBuyNow
  state.isBuyNow = false

  if (!inventorySelectedModel.value?.id) {
    consola.error('inventory_id be undefined')
    return
  }

  const body: AddProductToCartRequest = {
    inventory_id: inventorySelectedModel.value.id,
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

// ------ Side effects
watch(
  () => [stateSubmit.variantOption, stateSubmit.variantSubOption],
  () => {
    stateSubmit.quantity = 1
    if (product.variant_type === ProductVariantTypes.SINGLE) {
      const foundInventory = inventoriesMap.get(stateSubmit.variantOption)
      if (foundInventory) {
        inventorySelectedModel.value = foundInventory
      }
    }
    if (product.variant_type === ProductVariantTypes.COMBINE) {
      const foundInventory = inventoriesMap.get(`${stateSubmit.variantOption} / ${stateSubmit.variantSubOption}`)
      if (foundInventory) {
        inventorySelectedModel.value = foundInventory
      }
    }
  },
  { deep: true },
)
</script>

<template>
  <UForm
    ref="formRef"
    :validate-on="['submit']"
    :state="stateSubmit"
    class="space-y-4"
    :validate="validateForm"
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
          :options="state.variantOpts"
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
          :options="state.subVariantOpts"
        />
      </UFormGroup>

      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
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
            @click="() => stateSubmit.quantity++"
          />
        </UButtonGroup>
      </div>
    </div>

    <div class="flex gap-4">
      <UButton
        size="xl"
        variant="outline"
        type="submit"
        :disabled="isPendingAddProductToCart"
        @click="state.isBuyNow = false"
      >
        Add to cart
      </UButton>
      <UButton
        size="xl"
        type="submit"
        :disabled="isPendingAddProductToCart"
        @click="state.isBuyNow = true"
      >
        Buy it now
      </UButton>
    </div>
  </UForm>
</template>
