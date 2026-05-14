<script setup lang="ts">
import { ORDER_CONFIG } from '~/config/enums/order'
import { useCartStore } from '~/stores/cart'
import { PRODUCT_VARIANT_TYPES } from '~/config/enums/product'
import { useGetCart, useUpdateCart } from '~/services/cart'
import type { ResponseGetCart } from '~/types/request-api/cart'
import type { Cart } from '~/types/cart'

const cartStore = useCartStore()
const queryClient = useQueryClient()
const route = useRoute()

const tempCartId = route.query['c'] as Cart['id']

const {
  data: dataGetCart,
} = useGetCart({ cartId: tempCartId })

const {
  mutateAsync: updateCart,
} = useUpdateCart()

const shopCart = computed(() => dataGetCart.value?.cart && dataGetCart?.value?.cart.shopGroups[0])
const productCart = computed(() => shopCart.value?.items[0])

// const percentCoupon = computed(() => {
//   const coupon = productCart.value?.percent_coupon;
//   if (coupon) {
//     return {
//       ...coupon,
//       endInDays: Math.abs(dayjs(coupon.start_date).diff(coupon?.end_date, 'day')),
//     };
//   }
//   return undefined;
// });

const showNoteInput = ref(!!cartStore.stateCheckoutNow.note)

const tempProductQty = ref(productCart.value?.quantity || 0)

const variantNames = computed(() => {
  if (productCart.value && productCart.value.inventory.variantName) {
    const [primary, sub] = productCart.value.inventory.variantName.split('-')
    return { primary, sub }
  }
  return { primary: '', sub: '' }
})

const decreaseQty = () => {
  if (tempProductQty.value === 1) return
  tempProductQty.value--
}

watchDebounced(
  tempProductQty,
  async () => {
    const { summary } = await updateCart({
      cartId: tempCartId,
      quantity: tempProductQty.value,
    })

    queryClient.setQueryData<ResponseGetCart>(['get-cart', tempCartId], (oldData) => {
      if (!oldData) return oldData
      return {
        ...oldData,
        summary,
      }
    })
  },
  { debounce: 500, maxWait: 1000 },
)
</script>

<template>
  <UCard
    v-if="shopCart && productCart"
    :ui="{ base: 'overflow-visible' }"
    class="mb-4"
  >
    <div class="flex flex-col">
      <h3 class="mb-3 text-lg font-medium">
        {{ shopCart?.shop?.name }}
      </h3>
      <div class="mb-8 flex gap-4">
        <NuxtImg
          :src="`domainAwsS3/${productCart?.product.imageUrl}`"
          width="180"
          height="180"
          class="max-h-[180px] max-w-[180px] cursor-pointer rounded"
        />

        <div class="flex w-full justify-between">
          <div class="space-y-2">
            <h1 class="cursor-pointer text-xl font-semibold">
              {{ productCart?.product.title }}
            </h1>

            <div class="flex flex-col gap-1">
              <div
                v-if="
                  productCart.product.variantType === PRODUCT_VARIANT_TYPES.SINGLE
                    || productCart.product.variantType === PRODUCT_VARIANT_TYPES.COMBINE
                "
                class="text-lg text-zinc-500"
              >
                {{ productCart?.product.variantGroupName }}:
                {{ variantNames.primary }}
              </div>
              <div
                v-if="productCart.product.variantType === PRODUCT_VARIANT_TYPES.COMBINE"
                class="text-lg text-zinc-500"
              >
                {{ productCart?.product.variantSubGroupName }}:
                {{ variantNames.sub }}
              </div>
            </div>

            <div class="w-1/2">
              <UButtonGroup
                size="lg"
                orientation="horizontal"
              >
                <UButton
                  icon="i-heroicons-minus"
                  color="white"
                  class="rounded-l-md rounded-r-none"
                  :disabled="cartStore.stateCheckoutNow.isPendingCreateOrder"
                  @click="decreaseQty"
                />
                <UInput
                  v-model.number="tempProductQty"
                  v-numeric
                  v-max-number="productCart.inventory.stock"
                  class="rounded-l-none"
                  type="number"
                  :disabled="cartStore.stateCheckoutNow.isPendingCreateOrder"
                  :ui="{ base: 'text-center rounded-l-none' }"
                />
                <UButton
                  icon="i-heroicons-plus"
                  color="white"
                  :disabled="cartStore.stateCheckoutNow.isPendingCreateOrder"
                  class="rounded-l-none rounded-r-md"
                  @click="() => tempProductQty++"
                />
              </UButtonGroup>
            </div>
          </div>

          <div class="space-y-2 text-right">
            <div v-if="productCart.inventory.salePrice">
              <div class="text-xl font-medium text-green-700">
                {{ convertCurrency(productCart.inventory.salePrice) }}
              </div>
              <div class="text-sm text-zinc-500">
                <span class="line-through">
                  {{ convertCurrency(productCart.inventory.price) }}
                </span>
              </div>
            </div>
            <div
              v-else
              class="text-xl font-medium text-customGray-950"
            >
              {{ convertCurrency(productCart.inventory.price) }}
            </div>
          </div>
        </div>
      </div>

      <UDivider />

      <div class="mt-6 flex w-fit flex-col gap-4">
        <CheckoutAddRemovePromoCoupons />
        <div>
          <UButton
            variant="ghost"
            icon="i-heroicons-clipboard-document-list"
            color="gray"
            :disabled="cartStore.stateCheckoutNow.isPendingCreateOrder"
            class="mb-3 w-fit"
            @click="showNoteInput = !showNoteInput"
          >
            Add a note to {{ shopCart.shop.name }}
          </UButton>

          <UTextarea
            v-if="showNoteInput"
            v-model="cartStore.stateCheckoutNow.note"
            autoresize
            :maxlength="ORDER_CONFIG.MAX_CHAR_NOTE"
            :rows="3"
            size="lg"
          />
        </div>
      </div>
    </div>
  </UCard>
</template>

<style scoped>

</style>
