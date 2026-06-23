<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import Categories from './categories.vue'
import { ROUTES } from '~/shared/config/enums/routes'
import { useGetCart } from '~/shared/server-state/cart/cart.query'
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query'
import { hasSellerAccess } from '~/shared/utils/seller-access'

const loadCartMegaMenu = () => import('./cart-mega-menu.vue')
const loadSearchAllMegaMenu = () => import('./search-all-mega-menu.vue')
const loadAccountDropdown = () => import('./account-dropdown.vue')
const loadNotificationPopover = () => import('./notification-popover.vue')

const CartMegaMenu = defineAsyncComponent({
  loader: loadCartMegaMenu,
  suspensible: false,
})
const SearchAllMegaMenu = defineAsyncComponent({
  loader: loadSearchAllMegaMenu,
  suspensible: false,
})
const AccountDropdown = defineAsyncComponent({
  loader: loadAccountDropdown,
  suspensible: false,
})
const NotificationPopover = defineAsyncComponent({
  loader: loadNotificationPopover,
  suspensible: false,
})

const route = useRoute()
const modal = useModal()
const config = useRuntimeConfig()

const {
  data: dataGetCart,
} = useGetCart()

const {
  data: dataUserAuth,
  isPending: isPendingUserAuth,
} = useGetCurrentUser()

const isShowCart = ref(false)
const isShowSearch = ref(false)
const hasLoadedCartMegaMenu = ref(false)
const hasLoadedSearchAllMegaMenu = ref(false)

async function preloadCartMegaMenu() {
  hasLoadedCartMegaMenu.value = true
  await loadCartMegaMenu()
}

async function preloadSearchAllMegaMenu() {
  hasLoadedSearchAllMegaMenu.value = true
  await loadSearchAllMegaMenu()
}

function preloadAuthMenu() {
  void loadNotificationPopover()
  void loadAccountDropdown()
}

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

async function toggleSearchMenu() {
  if (!isShowSearch.value) {
    void preloadSearchAllMegaMenu()
  }

  isShowSearch.value = !isShowSearch.value
  isShowCart.value = false
}

async function toggleCartMenu() {
  if (!isShowCart.value) {
    void preloadCartMegaMenu()
  }

  isShowCart.value = !isShowCart.value
  isShowSearch.value = false
}

function handleSearchTriggerHover() {
  void preloadSearchAllMegaMenu()
  isShowCart.value = false
}

function handleCartTriggerHover() {
  void preloadCartMegaMenu()
  isShowSearch.value = false
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
            v-if="hasLoadedCartMegaMenu"
            :show="isShowCart"
            class="mt-8"
          />
          <SearchAllMegaMenu
            v-if="hasLoadedSearchAllMegaMenu"
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
              @click="toggleSearchMenu"
              @mouseover="handleSearchTriggerHover"
              @focus="preloadSearchAllMegaMenu"
            >
              <AppIcon name="search" />
            </UButton>
          </UTooltip>

          <ClientOnly>
            <template #fallback>
              <USkeleton class="size-6 rounded-full" />
            </template>

            <template v-if="isPendingUserAuth && !dataUserAuth">
              <USkeleton class="size-6 rounded-full" />
            </template>
            <template v-else-if="dataUserAuth?.user">
              <NotificationPopover @mouseenter="preloadAuthMenu" />
              <AccountDropdown
                @hover-trigger="isShowCart = false"
                @mouseenter="preloadAuthMenu"
              />
            </template>
            <template v-else>
              <UTooltip text="Sign in">
                <UButton
                  data-testid="header-sign-in-trigger"
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
          </ClientOnly>

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
              @click="toggleCartMenu"
              @mouseover="handleCartTriggerHover"
            >
              <UButton
                id="cart-btn"
                data-testid="header-cart-trigger"
                square
                variant="ghost"
                color="gray"
                @click.stop="toggleCartMenu"
                @mouseover="handleCartTriggerHover"
                @focus="preloadCartMegaMenu"
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
