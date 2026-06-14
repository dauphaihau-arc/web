<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import Categories from './categories.vue'
import { ROUTES } from '~/shared/config/enums/routes'
import { useGetCart } from '~/shared/server-state/cart/cart.query'
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query'
import { hasSellerAccess } from '~/shared/utils/seller-access'

const CartMegaMenu = defineAsyncComponent(() => import('./cart-mega-menu.vue'))
const SearchAllMegaMenu = defineAsyncComponent(() => import('./search-all-mega-menu.vue'))
const AccountDropdown = defineAsyncComponent(() => import('./account-dropdown.vue'))
const NotificationPopover = defineAsyncComponent(() => import('./notification-popover.vue'))

const route = useRoute()
const modal = useModal()
const config = useRuntimeConfig()

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
  return dataGetCart.value?.cart?.total_quantity ?? 0
})

const sellerCtaLabel = computed(() => {
  if (!dataUserAuth.value?.user) {
    return 'Seller Center'
  }

  return hasSellerAccess(dataUserAuth.value.user) ? 'Manage Shop' : 'Start Selling'
})

function getSellerRedirectURL() {
  const sellerAppURL = config.public.sellerAppURL.replace(/\/+$/, '')

  if (!dataUserAuth.value?.user) {
    return `${sellerAppURL}/login`
  }

  if (hasSellerAccess(dataUserAuth.value.user)) {
    return `${sellerAppURL}/dashboard`
  }

  return `${sellerAppURL}/sell`
}

function navigateToSellerApp() {
  return navigateTo(getSellerRedirectURL(), { external: true })
}

const showRegisterLoginDialog = async () => {
  const dialog = await import('~/app/components/dialogs/login-register/register-login-dialog.vue')
  modal.open(dialog.default)
}
</script>

<template>
  <div>
    <header
      class="header"
      :class="{ 'hidden-header': !state.showNavbar }"
      @mouseleave="onMouseleave"
    >
      <nav class="max-w-home-layout mx-auto grid grid-cols-[1fr_auto_1fr] items-start py-3">
        <NuxtLink
          id="brand"
          :to="ROUTES.HOME"
          class="h-fit p-1 text-xl font-bold"
        >
          Arc
        </NuxtLink>

        <div class="mt-1 justify-self-center">
          <Categories class="mx-3" />
          <CartMegaMenu
            v-if="isShowCart"
            :show="isShowCart"
            class="mt-8"
          />
          <SearchAllMegaMenu
            v-if="isShowSearch"
            :show="isShowSearch"
            class="mt-8"
          />
        </div>

        <div class="flex h-fit items-center justify-self-end gap-2">
          <UTooltip text="Search">
            <UButton
              square
              color="gray"
              variant="ghost"
              @click="isShowSearch = !isShowSearch"
              @mouseover="isShowCart = false"
            >
              <AppIcon name="search" />
            </UButton>
          </UTooltip>

          <template v-if="dataUserAuth?.user">
            <NotificationPopover />
            <AccountDropdown @hover-trigger="isShowCart = false" />
          </template>

          <template v-else>
            <UTooltip text="Sign in">
              <UButton
                square
                color="gray"
                variant="ghost"
                @click="showRegisterLoginDialog"
                @mouseover="isShowCart = false"
              >
                <AppIcon name="user" />
              </UButton>
            </UTooltip>
          </template>

          <UTooltip :text="sellerCtaLabel">
            <UButton
              square
              color="gray"
              variant="ghost"
              @click="navigateToSellerApp"
            >
              <AppIcon name="shop" />
            </UButton>
          </UTooltip>

          <UTooltip text="Cart">
            <UChip
              :text="totalProductCarts"
              :show="totalProductCarts > 0"
              class="cursor-pointer"
              size="lg"
              position="bottom-right"
              @click="isShowCart = !isShowCart"
              @mouseover="isShowSearch = false"
            >
              <UButton
                id="cart-btn"
                square
                variant="ghost"
                color="gray"
              >
                <AppIcon name="cart" />
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
      leave-active-class="opacity-100"
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
  bg-surface-muted/75
}

.header {
  @apply fixed top-0 z-[3] bg-surface w-screen border-b border-b-border-subtle;
  transform: translate3d(0, 0, 0);
  transition: 0.1s all ease-out;
}

.header.hidden-header {
  transform: translate3d(0, -100%, 0);
}
</style>
