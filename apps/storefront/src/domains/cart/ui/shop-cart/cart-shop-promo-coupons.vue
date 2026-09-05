<script setup lang="ts">
import ShopCartPromoCouponsUi from './shop-cart-promo-coupons-ui.vue'
import { StatusCodes } from 'http-status-codes'
import { FetchError } from 'ofetch'
import { consola } from 'consola'
import { type AdditionInfoShopCarts, useCartStore } from '~/domains/cart/stores/cart.store'
import { useUpdateCart } from '~/domains/cart/mutations/update-cart.mutation'
import { toastCustom } from '~/shared/config/toast'
import type { GetCartResponse } from '~/domains/cart/api/contracts/cart.contract'

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

const disabledAddBtn = computed(() => !state.code || isPendingUpdateCart.value)

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
  catch {
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
    catch {
      toast.add({
        ...toastCustom.error,
        title: 'Delete all coupons failed',
      })
    }
  }
}
</script>

<template>
  <ShopCartPromoCouponsUi
    v-model:code="state.code"
    v-model:show-input="state.showAddCouponCodeInput"
    :codes="state.codes"
    :error="state.errorMsg"
    :disabled="isPendingUpdateCart"
    :disabled-add="disabledAddBtn"
    @apply="addCoupon"
    @toggle="toggleShowAddCouponInput"
    @remove-code="deleteCoupon"
  />
</template>
