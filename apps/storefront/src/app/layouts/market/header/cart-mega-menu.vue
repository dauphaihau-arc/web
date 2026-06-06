<script lang="ts" setup>
import { routes } from '~/shared/navigation/routes'
import { useGetCart } from '~/shared/server-state/cart/cart.query'

const props = defineProps<{ show: boolean }>()

const {
  data: dataGetCart,
} = useGetCart()

const remainProductCart = computed(() => {
  if (dataGetCart.value?.cart) {
    return dataGetCart.value.cart.total_quantity - dataGetCart.value.cart.recent_items.length
  }
  return 0
})
</script>

<template>
  <transition name="slide-down">
    <div
      v-if="props.show"
      id="mega-menu-cart"
    >
      <div class="mx-auto ml-5 pb-12">
        <div class="mb-4 flex justify-between gap-3">
          <div class="text-2xl font-semibold">
            Cart
          </div>
          <UButton
            v-if="dataGetCart?.cart?.total_quantity"
            :to="routes.cart()"
            label="Review Cart"
          >
            <template #trailing>
              <UIcon name="i-heroicons-arrow-right-20-solid" />
            </template>
          </UButton>
        </div>

        <div class="mb-10">
          <div v-if="dataGetCart?.cart && dataGetCart?.cart.recent_items.length > 0">
            <div class="mb-6 space-y-8">
              <div
                v-for="(productCart, index) in dataGetCart.cart.recent_items"
                :key="index"
              >
                <NuxtLink
                  class="flex items-center gap-6"
                  :to="routes.productDetail(productCart.product.shop.slug, productCart.product.slug)"
                >
                  <NuxtImg
                    :src="productCart.product.image_url"
                    width="70"
                    height="70"
                    class="rounded"
                  />
                  <div>
                    <div class="text-xl font-medium">
                      {{ productCart.product.title }}
                    </div>
                    <div class="text-[15px] text-text-muted">
                      {{ productCart.inventory.variant_name }}
                    </div>
                    <div class="text-[15px] tracking-wide text-text-muted">
                      x{{ productCart.quantity }}
                    </div>
                  </div>
                </NuxtLink>
              </div>
            </div>
            <div
              v-if="remainProductCart > 0"
              class="text-text-strong"
            >
              {{ remainProductCart }} more product in your Cart
            </div>
          </div>
          <div
            v-else
            class="text-sm text-text-strong"
          >
            Your cart is empty.
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: max-height 0.3s ease-in-out;
}

.slide-down-enter-to,
.slide-down-leave-from {
  overflow: hidden;
  max-height: 500px;
}

.slide-down-enter-from,
.slide-down-leave-to {
  overflow: hidden;
  max-height: 0;
}

.item-profile {
  @apply font-medium flex items-center gap-2 cursor-pointer opacity-70 hover:opacity-100
  hover:bg-surface-muted px-2 py-1 rounded-md
}
</style>
