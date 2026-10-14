<script lang="ts" setup>
import ProductCardImage from '~/domains/product/ui/product-card-image.vue'
import { routes } from '~/shared/navigation/routes'
import { useGetCart } from '~/domains/cart/queries/cart.query'

const props = withDefaults(defineProps<{
  show: boolean
  variant?: 'mega' | 'screen'
}>(), {
  variant: 'mega',
})

const isScreenVariant = computed(() => props.variant === 'screen')
const contentClass = computed(() => (isScreenVariant.value
  ? 'px-12  pb-8'
  : 'mx-auto ml-5 pb-12'))

/** `md` breakpoint: from tablet up the screen panel keeps the primary action in the heading row. */
const isTabletUp = useMediaQuery('(min-width: 768px)')

/** Mobile/tablet panel scales the copy down; the desktop megamenu keeps its original sizes. */
const textClass = computed(() => (isScreenVariant.value
  ? {
      title: 'text-xl md:text-2xl',
      item: 'text-base md:text-lg',
      meta: 'text-xs md:text-sm',
      empty: 'text-sm md:text-base',
    }
  : {
      title: 'text-2xl',
      item: 'text-xl',
      meta: 'text-[15px]',
      empty: 'text-sm',
    }))

const { data: dataGetCart } = useGetCart()
const MAX_RECENT_PRODUCTS = 3

const recentProducts = computed(
  () => dataGetCart.value?.cart?.recent_items.slice(0, MAX_RECENT_PRODUCTS) ?? [],
)

const remainProductCart = computed(() => {
  const itemCount = dataGetCart.value?.cart?.shop_groups.reduce(
    (total, group) => total + group.items.length,
    0,
  ) ?? 0
  return Math.max(0, itemCount - recentProducts.value.length)
})
</script>

<template>
  <transition
    name="slide-down"
    :css="!isScreenVariant"
  >
    <div
      v-if="props.show"
      id="mega-menu-cart"
    >
      <div :class="contentClass">
        <div class="mb-4 flex justify-between gap-3">
          <div :class="[textClass.title, 'font-semibold']">
            Cart
          </div>
          <UButton
            v-if="(!isScreenVariant || isTabletUp) && dataGetCart?.cart?.total_quantity"
            :to="routes.cart()"
            label="Review Cart"
          >
            <template #trailing>
              <UIcon name="i-heroicons-arrow-right-20-solid" />
            </template>
          </UButton>
        </div>

        <div class="mb-10">
          <div
            v-if="
              dataGetCart?.cart
                && dataGetCart?.cart.recent_items.length > 0
            "
          >
            <div class="mb-6 space-y-8">
              <div
                v-for="productCart in recentProducts"
                :key="productCart.product.id"
              >
                <NuxtLink
                  class="flex items-center gap-6"
                  :to="
                    routes.productDetail(
                      productCart.product.shop.slug,
                      productCart.product.slug,
                    )
                  "
                >
                  <ProductCardImage
                    :src="productCart.product.image_url"
                    frame-class="w-[70px] shrink-0 cursor-pointer"
                    :frame-style="{ aspectRatio: '1 / 1' }"
                  />
                  <div>
                    <div :class="[textClass.item, 'font-medium']">
                      {{ productCart.product.title }}
                    </div>
                    <div
                      :class="[textClass.meta, 'text-text-muted']"
                    >
                      {{
                        productCart.inventory.selected_options
                          .map(option => `${option.option_name}: ${option.value}`)
                          .join(', ')
                      }}
                    </div>
                    <div
                      :class="[textClass.meta, 'tracking-wide text-text-muted']"
                    >
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
              {{ remainProductCart }} more products in your Cart
            </div>
          </div>
          <div
            v-else
            :class="[textClass.empty, 'text-text-strong']"
          >
            Your cart is empty.
          </div>
        </div>

        <!-- Mobile only: the primary action sits below the list, full width for thumb reach. -->
        <div
          v-if="isScreenVariant && !isTabletUp && dataGetCart?.cart?.total_quantity"
          class="mt-8"
        >
          <UButton
            block
            size="lg"
            :to="routes.cart()"
            label="Review Cart"
          >
            <template #trailing>
              <UIcon name="i-heroicons-arrow-right-20-solid" />
            </template>
          </UButton>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped lang="postcss">
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
  hover:bg-surface-muted px-2 py-1 rounded-md;
}
</style>
