<script lang="ts" setup>
import LoadingSvg from '~/shared/components/loading-svg.vue'
import CartShopCart from '~/modules/pages/cart/cart-shop-cart.vue'
import CartSummaryOrder from '~/modules/pages/cart/cart-summary-order.vue'
import { useCartStore } from '~/shared/stores/cart'
import { useGetCart } from '~/shared/services/cart'

definePageMeta({ layout: 'market', middleware: ['auth'] })

const cartStore = useCartStore()

const wrapperSummaryOrderRef = ref<HTMLDivElement | null>(null)
const contentSummaryOrderRef = ref<HTMLDivElement | null>(null)

const {
  isPending: isPendingGetCart,
  data: dataGetCart,
} = useGetCart()

watch(dataGetCart, () => {
  if (cartStore.additionInfoShopCarts.size === 0 && dataGetCart.value?.cart?.shopGroups) {
    dataGetCart.value.cart.shopGroups.forEach((item) => {
      cartStore.additionInfoShopCarts.set(item.shop.id, {
        promoCodes: [],
        note: '',
      })
    })
  }
}, { immediate: true })

function onScroll() {
  const scrollTop = window.scrollY
  const viewportHeight = window.innerHeight

  if (!wrapperSummaryOrderRef.value || !contentSummaryOrderRef.value) {
    return
  }

  const wrapperContentTop = wrapperSummaryOrderRef.value?.getBoundingClientRect()?.top + window.pageYOffset
  const contentHeight = contentSummaryOrderRef.value?.getBoundingClientRect().height

  if (contentHeight && scrollTop >= contentHeight - viewportHeight + wrapperContentTop) {
    contentSummaryOrderRef.value.style.transform = `translateY(-${(contentHeight - viewportHeight + wrapperContentTop)}px)`
    contentSummaryOrderRef.value.style.position = 'fixed'
  }
  else {
    contentSummaryOrderRef.value.style.transform = ''
    contentSummaryOrderRef.value.style.position = ''
  }
}

onMounted(() => {
  window.addEventListener('scroll', onScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <div class="mt-2 py-12">
    <div
      v-if="isPendingGetCart"
      class="grid h-[80vh] w-full place-content-center"
    >
      <LoadingSvg :child-class="'!w-12 !h-12'" />
    </div>
    <div v-else-if="dataGetCart?.cart && dataGetCart.cart.shopGroups?.length > 0">
      <div>
        <h1 class="mb-4 text-2xl font-medium">
          {{ dataGetCart?.cart?.totalQuantity }} products in your cart
        </h1>

        <div class="grid grid-cols-12 gap-16">
          <div class="col-span-8">
            <CartShopCart
              v-for="shopCart of dataGetCart.cart.shopGroups"
              :key="shopCart.shop.id"
              :shop-cart="shopCart"
            />
          </div>

          <div ref="wrapperSummaryOrderRef">
            <div
              ref="contentSummaryOrderRef"
              class="w-[400px]"
            >
              <CartSummaryOrder />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      v-else
      class="text-center"
    >
      <h3 class="text-3xl text-customGray-950">
        Your cart is empty.
      </h3>
    </div>
  </div>
</template>
