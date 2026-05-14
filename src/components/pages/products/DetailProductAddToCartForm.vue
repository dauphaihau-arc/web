<script setup lang="ts">
import { consola } from 'consola'
import type { FormError, FormSubmitEvent } from '#ui/types'
import { ROUTES } from '~/config/enums/routes'
import { PRODUCT_VARIANT_TYPES } from '~/config/enums/product'
import type { AddProductToCartBody, ResponseGetCart } from '~/types/request-api/cart'
import type { ProductVariant } from '~/types/product'
import { RegisterLoginDialog } from '#components'
import { useAddProductToCart } from '~/services/cart'
import { useGetCurrentUser } from '~/services/user'
import type { ResponseGetDetailProduct, ResponseGetDetailProduct_Inventory } from '~/types/request-api/product'
import { toastCustom } from '~/config/toast'

interface StateSubmit {
  quantity: number
  variantOption: string
  variantSubOption: string
}

type Inventory = ResponseGetDetailProduct_Inventory

const props = defineProps<ResponseGetDetailProduct>()
const { product } = props

const inventorySelectedModel = defineModel<Inventory>('inventorySelected')

const modal = useModal()
const { data: dataUserAuth } = useGetCurrentUser()
const queryClient = useQueryClient()
const toast = useToast()

const {
  mutateAsync: addProductToCart,
  isPending: isPendingAddProductToCart,
} = useAddProductToCart()

// ------------- States
const formRef = ref()

const state = reactive({
  variantOpts: [] as ProductVariant['variant_name'][],
  subVariantOpts: [] as ProductVariant['variant_name'][],
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
  return product.inventories.reduce((acc, inv) => acc + inv.stock, 0)
})

const inventoriesMap = new Map<Inventory['variant'], Inventory>()

// ------------- Lifecycle Hooks
onMounted(() => {
  switch (product.variant_type) {
    case PRODUCT_VARIANT_TYPES.NONE:
      inventorySelectedModel.value = props.product.inventories[0]
      break
    case PRODUCT_VARIANT_TYPES.SINGLE:
      props.product.inventories.forEach((inv) => {
        inventoriesMap.set(inv.variant, inv)
        if (inv.variant) {
          state.variantOpts.push(inv.variant)
        }
      })
      break
    case PRODUCT_VARIANT_TYPES.COMBINE: {
      props.product.inventories.forEach((inv) => {
        inventoriesMap.set(inv.variant, inv)
        if (inv.variant) {
          const [primaryVariantName, subVariantName] = inv.variant.split('-')
          if (!state.variantOpts.includes(primaryVariantName)) {
            state.variantOpts.push(primaryVariantName)
          }
          if (!state.subVariantOpts.includes(subVariantName)) {
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

  if (product.variant_type !== PRODUCT_VARIANT_TYPES.NONE) {
    if (!stateValidate.variantOption) {
      errors.push({
        path: 'variantOption',
        message: 'Required',
      })
    }

    if (product.variant_type === PRODUCT_VARIANT_TYPES.COMBINE && !stateValidate.variantSubOption) {
      errors.push({
        path: 'variantSubOption',
        message: 'Required',
      })
    }
  }
  return errors
}

async function onSubmit(event: FormSubmitEvent<StateSubmit>) {
  if (!dataUserAuth.value?.user) {
    modal.open(RegisterLoginDialog)
    return
  }
  formRef.value.clear()

  if (!inventorySelectedModel.value?.id) {
    consola.error('inventory_id be undefined')
    return
  }

  const body: AddProductToCartBody = {
    inventoryId: inventorySelectedModel.value.id,
    quantity: event.data.quantity,
  }
  if (state.isBuyNow) {
    body.isTemp = true
    const response = await addProductToCart(body)
    if (response.cart === null || !response.cart?.id) {
      toast.add({
        ...toastCustom.error,
        title: 'Checkout failed',
      })
      return
    }
    queryClient.setQueryData<ResponseGetCart>(['get-cart', response.cart.id], response)
    navigateTo(`${ROUTES.CHECKOUT}?c=${response.cart.id}`)
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
  queryClient.setQueryData<ResponseGetCart>(['get-cart', 'my-cart'], response)
  navigateTo(ROUTES.CART)
}

// ------ Side effects
watch(
  () => [stateSubmit.variantOption, stateSubmit.variantSubOption],
  () => {
    stateSubmit.quantity = 1
    if (product.variant_type === PRODUCT_VARIANT_TYPES.SINGLE) {
      const foundInventory = inventoriesMap.get(stateSubmit.variantOption)
      if (foundInventory) {
        inventorySelectedModel.value = foundInventory
      }
    }
    if (product.variant_type === PRODUCT_VARIANT_TYPES.COMBINE) {
      const foundInventory = inventoriesMap.get(`${stateSubmit.variantOption}-${stateSubmit.variantSubOption}`)
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
        v-if="product.variant_type === PRODUCT_VARIANT_TYPES.SINGLE
          || product.variant_type === PRODUCT_VARIANT_TYPES.COMBINE"
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
        v-if="product.variant_type === PRODUCT_VARIANT_TYPES.COMBINE"
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
        variant="soft"
        type="submit"
        :disabled="isPendingAddProductToCart"
      >
        Add to card
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
