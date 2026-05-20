<script setup lang="ts">
import CartMegaMenu from './cart-mega-menu.vue'
import HeaderCategories from './header-categories.vue'
import SearchAllMegaMenu from './search-all-mega-menu.vue'
import { ROUTES } from '~/shared/config/enums/routes'
import { useGetCart } from '~/shared/server-state/me/cart/cart.query'
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query'

const route = useRoute()

const {
  data: dataGetCart,
} = useGetCart()

const { data: dataUserAuth } = useGetCurrentUser()

const isShowCart = ref(false)
const isShowSearch = ref(false)

watch(() => [route.path, route.query], () => {
  isShowSearch.value = false
  isShowCart.value = false
})

const onMouseleave = () => {
  isShowSearch.value = false
  isShowCart.value = false
}

const OFFSET = 60

const state = reactive({
  showNavbar: true,
  lastScrollPosition: 0,
  scrollValue: 0,
})

function onScroll() {
  if (window.pageYOffset < 0) {
    return
  }
  if (Math.abs(window.pageYOffset - state.lastScrollPosition) < OFFSET) {
    return
  }
  state.showNavbar = window.pageYOffset < state.lastScrollPosition
  state.lastScrollPosition = window.pageYOffset
}

onMounted(async () => {
  state.lastScrollPosition = window.pageYOffset
  window.addEventListener('scroll', onScroll)
  const viewportMeta = document.createElement('meta')
  viewportMeta.name = 'viewport'
  viewportMeta.content = 'width=device-width, initial-scale=1'
  document.head.appendChild(viewportMeta)
})

const totalProductCarts = computed(() => {
  if (
    dataUserAuth.value?.user
    && dataGetCart.value?.cart && dataGetCart.value.cart?.total_quantity > 0
  ) {
    return dataGetCart.value.cart.total_quantity
  }
  return 0
})
</script>

<template>
  <div>
    <header
      class="header"
      :class="{ 'hidden-header': !state.showNavbar }"
      @mouseleave="onMouseleave"
    >
      <nav class="max-w-home-layout mx-auto flex justify-between py-3">
        <NuxtLink
          id="brand"
          :to="ROUTES.HOME"
          class="h-fit p-1 text-xl font-bold"
        >
          Arc
        </NuxtLink>

        <div class="mt-1">
          <HeaderCategories class="mx-3" />
          <CartMegaMenu
            :show="isShowCart"
            class="mt-8"
          />
          <SearchAllMegaMenu
            :show="isShowSearch"
            class="mt-8"
          />
        </div>
        <div class="relative flex h-fit items-center gap-4">
          <div class="absolute right-12 flex gap-4">
            <UTooltip text="Search">
              <UButton
                color="gray"
                variant="ghost"
                class="icon-button"
                @click="isShowSearch = !isShowSearch"
                @mouseover="isShowCart = false"
              >
                <Icon
                  name="i-uil:search"
                  mode="svg"
                  class="size-5"
                />
              </UButton>
            </UTooltip>
          </div>

          <UTooltip text="Cart">
            <UChip
              :text="totalProductCarts"
              :show="totalProductCarts > 0"
              class="cursor-pointer"
              size="xl"
              position="bottom-right"
              :ui="{
                position: {
                  'bottom-right': 'translate-y-[-5px] translate-x-[-5px]',
                },
              }"
              @click="isShowCart = !isShowCart"
              @mouseover="isShowSearch = false"
            >
              <UButton
                id="cart-btn"
                class="icon-button"
                variant="ghost"
                color="gray"
              >
                <Icon
                  name="i-uil:cart"
                  mode="svg"
                  class="size-5"
                />
              </UButton>
            </UChip>
          </UTooltip>
        </div>
      </nav>
    </header>

    <transition
      enter-class="ease-out duration-500"
      enter-to-class="opacity-100"
      enter-active-class="opacity-0"
      leave-class="ease-in duration-500"
      leave-ative-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isShowCart || isShowSearch"
        class="overlay"
      />
    </transition>
  </div>
</template>

<style scoped>
.icon-button {
  padding: 8px;
}

.overlay {
  @apply fixed z-[1] inset-0 transition-opacity
  bg-gray-200/75
}

.header {
  @apply fixed top-0 z-[3] bg-white w-screen border-b border-b-zinc-200;
  transform: translate3d(0, 0, 0);
  transition: 0.1s all ease-out;
}

.header.hidden-header {
  transform: translate3d(0, -100%, 0);
}
</style>
