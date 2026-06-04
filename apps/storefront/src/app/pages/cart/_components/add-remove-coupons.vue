<script setup lang="ts">
import { StatusCodes } from 'http-status-codes'
import { FetchError } from 'ofetch'
import { consola } from 'consola'
import { type AdditionInfoShopCarts, useCartStore } from '~/shared/stores/cart/cart.store'
import { useUpdateCart } from '~/shared/server-state/cart/update-cart.mutation'
import { toastCustom } from '~/shared/config/toast'
import type { GetCartResponse } from '~/shared/api/cart/contracts/cart.contract'

const { shopId } = defineProps<{
  shopId: string
}>()

const cartStore = useCartStore()
const queryClient = useQueryClient()
const toast = useToast()

const state = reactive({
  showAddCouponCodeInput: false,
  code: '',
  codes: [] as string[],
  invalidCodes: [] as string[],
  errorMsg: '',
})

onMounted(() => {
  const additionInfoOrderShop = cartStore.additionInfoShopCarts.get(shopId)
  if (additionInfoOrderShop && additionInfoOrderShop.promoCodes.length > 0) {
    state.codes = additionInfoOrderShop.promoCodes
    state.showAddCouponCodeInput = true
  }
})

const {
  mutateAsync: updateCart,
  isPending: isPendingUpdateCart,
} = useUpdateCart({ onError: undefined })

const addCoupon = async () => {
  state.errorMsg = ''

  if (state.invalidCodes.length > 0 && state.invalidCodes.includes(state.code)) {
    state.errorMsg = 'Coupon code not found'
    return
  }

  const tempAdditionInfoShopCarts = new Map<AdditionInfoShopCarts['key'], AdditionInfoShopCarts['value']>(
    JSON.parse(JSON.stringify([...cartStore.additionInfoShopCarts])),
  )

  const tempAdditionInfoOrderShop = tempAdditionInfoShopCarts.get(shopId)
  if (!tempAdditionInfoOrderShop) {
    consola.error('tempAdditionInfoOrderShop be undefined')
    return
  }
  tempAdditionInfoOrderShop.promoCodes.push(state.code)

  const addition_info_shop_carts = Array.from(tempAdditionInfoShopCarts)
    .map(([keyShopId, value]) => ({
      shop_id: keyShopId,
      promo_codes: value.promoCodes,
    }))
    .filter(item => item.promo_codes.length > 0)

  try {
    const data = await updateCart({
      addition_info_shop_carts,
    })

    queryClient.setQueryData<GetCartResponse>(['get-cart', 'my-cart'], (oldData) => {
      if (!oldData || !oldData.cart) return oldData
      if (!data.cart) return { ...oldData, cart: data.cart }
      const foundShopCart = data.cart.shop_groups.find(sc => sc.shop.id === shopId)
      if (!foundShopCart) return oldData

      const shopGroupsUpdated = oldData.cart.shop_groups.map((sc) => {
        if (sc.shop.id === shopId) {
          return {
            ...sc,
            shipping_minor: foundShopCart.shipping_minor,
          }
        }
        return sc
      })
      return {
        ...oldData,
        cart: {
          ...oldData.cart,
          shop_groups: shopGroupsUpdated,
        },
        summary: data.summary,
      }
    })

    cartStore.additionInfoShopCarts.set(shopId, tempAdditionInfoOrderShop)
    state.codes = tempAdditionInfoOrderShop.promoCodes
    state.code = ''
  }
  catch (error) {
    if (error instanceof FetchError) {
      switch (error.status) {
        case StatusCodes.NOT_FOUND:
          state.errorMsg = 'Coupon code not found'
          state.invalidCodes.push(state.code)
          break
        case StatusCodes.UNPROCESSABLE_ENTITY:
          toast.add({
            ...toastCustom.error,
            title: error.data.message,
          })
          break
        default:
          toast.add({
            ...toastCustom.error,
            title: 'Add coupon failed',
          })
      }
    }
  }
}

const deleteCoupon = async (code: string) => {
  const tempAdditionInfoShopCarts = new Map<AdditionInfoShopCarts['key'], AdditionInfoShopCarts['value']>(
    JSON.parse(JSON.stringify([...cartStore.additionInfoShopCarts])),
  )
  const tempAdditionInfoOrderShop = tempAdditionInfoShopCarts.get(shopId)

  if (!tempAdditionInfoOrderShop) {
    consola.error('tempAdditionInfoOrderShop be undefined')
    return
  }
  tempAdditionInfoOrderShop.promoCodes = tempAdditionInfoOrderShop.promoCodes.filter(c => c !== code)

  const addition_info_shop_carts = Array.from(tempAdditionInfoShopCarts).map(([keyShopId, value]) => ({
    shop_id: keyShopId,
    promo_codes: value.promoCodes,
  }))

  try {
    const data = await updateCart({
      addition_info_shop_carts,
    })

    queryClient.setQueryData<GetCartResponse>(['get-cart', 'my-cart'], (oldData) => {
      if (!oldData || !oldData.cart) return oldData
      if (!data.cart) return { ...oldData, cart: data.cart }
      const foundShopCart = data.cart.shop_groups.find(sc => sc.shop.id === shopId)
      if (!oldData || !foundShopCart) return oldData

      const shopGroupsUpdated = oldData.cart.shop_groups.map((sc) => {
        if (sc.shop.id === shopId) {
          return {
            ...sc,
            shipping_minor: foundShopCart.shipping_minor,
          }
        }
        return sc
      })
      return {
        ...oldData,
        cart: {
          ...oldData.cart,
          shop_groups: shopGroupsUpdated,
        },
        summary: data.summary,
      }
    })

    const additionInfoOrderShop = tempAdditionInfoShopCarts.get(shopId)
    if (!additionInfoOrderShop) {
      consola.error('additionInfoOrderShop be undefined', additionInfoOrderShop)
      throw new Error()
    }
    cartStore.additionInfoShopCarts.set(shopId, additionInfoOrderShop)
    state.codes = tempAdditionInfoOrderShop.promoCodes
  }
  catch (e) {
    toast.add({
      ...toastCustom.error,
      title: 'Delete coupon failed',
    })
  }
}

const toggleShowAddCouponInput = async () => {
  state.showAddCouponCodeInput = !state.showAddCouponCodeInput
  if (!state.showAddCouponCodeInput) {
    const tempAdditionInfoShopCarts = new Map<AdditionInfoShopCarts['key'], AdditionInfoShopCarts['value']>(
      JSON.parse(JSON.stringify([...cartStore.additionInfoShopCarts])),
    )
    const tempAdditionInfoOrderShop = tempAdditionInfoShopCarts.get(shopId)

    if (!tempAdditionInfoOrderShop) {
      consola.error('tempAdditionInfoOrderShop be undefined')
      return
    }
    if (tempAdditionInfoOrderShop.promoCodes.length === 0) {
      return
    }
    tempAdditionInfoOrderShop.promoCodes = []

    const addition_info_shop_carts = Array.from(tempAdditionInfoShopCarts).map(([keyShopId, value]) => ({
      shop_id: keyShopId,
      promo_codes: value.promoCodes,
    }))

    try {
      const data = await updateCart({
        addition_info_shop_carts,
      })

      queryClient.setQueryData<GetCartResponse>(['get-cart', 'my-cart'], (oldData) => {
        if (!oldData || !oldData.cart) return oldData
        if (!data.cart) return { ...oldData, cart: data.cart }
        const foundShopCart = data.cart.shop_groups.find(sc => sc.shop.id === shopId)
        if (!oldData || !foundShopCart) return oldData

        const shopGroupsUpdated = oldData.cart.shop_groups.map((sc) => {
          if (sc.shop.id === shopId) {
            return {
              ...sc,
              shipping_minor: foundShopCart.shipping_minor,
            }
          }
          return sc
        })
        return {
          ...oldData,
          cart: {
            ...oldData.cart,
            shop_groups: shopGroupsUpdated,
          },
          summary: data.summary,
        }
      })
      const additionInfoOrderShop = tempAdditionInfoShopCarts.get(shopId)
      if (!additionInfoOrderShop) {
        consola.error('additionInfoOrderShop be undefined', additionInfoOrderShop)
        throw new Error()
      }
      cartStore.additionInfoShopCarts.set(shopId, additionInfoOrderShop)
      state.codes = []
    }
    catch (error) {
      toast.add({
        ...toastCustom.error,
        title: 'Delete all coupons failed',
      })
    }
  }
}
</script>

<template>
  <div>
    <UButton
      variant="ghost"
      icon="i-heroicons-ticket"
      color="gray"
      class="mb-1 w-fit"
      :disabled="isPendingUpdateCart"
      @click="toggleShowAddCouponInput"
    >
      {{ state.showAddCouponCodeInput ? 'Remove promo code' : 'Add promo code' }}
    </UButton>

    <div v-if="state.showAddCouponCodeInput">
      <div class="mb-2 flex gap-3">
        <UInput
          v-model="state.code"
          maxlength="30"
          placeholder="Promo code"
          :disabled="isPendingUpdateCart"
        />
        <UButton
          :disabled="!state.code || isPendingUpdateCart"
          @click="addCoupon"
        >
          Apply
        </UButton>
      </div>
      <div
        v-if="state.errorMsg"
        class="text-sm text-red-500"
      >
        {{ state.errorMsg }}
      </div>
      <div
        v-if="state.codes.length > 0"
        class="mt-2 flex flex-wrap gap-3"
      >
        <UBadge
          v-for="code in state.codes"
          :key="code"
          color="gray"
          variant="subtle"
          size="lg"
          class="cursor-pointer"
          @click="deleteCoupon(code)"
        >
          {{ code }}
        </UBadge>
      </div>
    </div>
  </div>
</template>
