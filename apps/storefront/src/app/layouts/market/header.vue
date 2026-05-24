<script setup lang="ts">
import CartMegaMenu from './cart-mega-menu.vue'
import HeaderCategories from './header-categories.vue'
import SearchAllMegaMenu from './search-all-mega-menu.vue'
import type { DropdownItem } from '#ui/types'
import RegisterLoginDialog from '~/app/components/dialogs/login-register/register-login-dialog.vue'
import { ROUTES } from '~/shared/config/enums/routes'
import { routes } from '~/shared/navigation/routes'
import { useLogout } from '~/shared/server-state/auth/logout.mutation'
import { useGetCart } from '~/shared/server-state/cart/cart.query'
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query'
import { hasSellerAccess } from '~/shared/utils/seller-access'

const route = useRoute()
const modal = useModal()
const config = useRuntimeConfig()

const {
  data: dataGetCart,
} = useGetCart()

const { data: dataUserAuth } = useGetCurrentUser()
const {
  mutate: logout,
  isPending: isPendingLogout,
} = useLogout()

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

type UserDropdownItem = Omit<DropdownItem, 'icon'> & {
  icon?: string
}

const itemsUserDropdown = computed<UserDropdownItem[][]>(() => [
  [
    {
      label: 'Orders',
      icon: 'orders',
      click: () => navigateTo(routes.orders()),
    },
    {
      label: 'Account',
      icon: 'account',
      click: () => navigateTo(routes.account()),
    },
  ],
  [
    {
      label: `Logout ${dataUserAuth.value?.user?.display_name ?? ''}`.trim(),
      icon: 'logout',
      disabled: isPendingLogout.value,
      click: () => {
        if (isPendingLogout.value) return
        logout()
      },
    },
  ],
])

const userInitial = computed(() => {
  return dataUserAuth.value?.user?.display_name?.trim().charAt(0).toUpperCase() || 'U'
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

  return `${sellerAppURL}/register`
}

function navigateToSellerApp() {
  return navigateTo(getSellerRedirectURL(), { external: true })
}

const showRegisterLoginDialog = () => {
  modal.open(RegisterLoginDialog)
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

        <div class="flex h-fit items-center justify-self-end gap-2">
          <UTooltip text="Search">
            <UButton
              color="gray"
              variant="ghost"
              class="icon-button"
              @click="isShowSearch = !isShowSearch"
              @mouseover="isShowCart = false"
            >
              <AppIcon name="search" />
            </UButton>
          </UTooltip>

          <template v-if="dataUserAuth?.user">
            <UDropdown
              :items="itemsUserDropdown as DropdownItem[][]"
              :popper="{ placement: 'bottom-end' }"
            >
              <template #item="{ item }">
                <div class="flex items-center gap-2">
                  <AppIcon
                    v-if="item.icon"
                    :name="item.icon"
                    size="xs"
                    class="text-gray-500"
                  />
                  <span>{{ item.label }}</span>
                </div>
              </template>

              <template #default="{ open: isAccountDropdownOpen }">
                <UTooltip
                  text="My account"
                  :prevent="isAccountDropdownOpen"
                >
                  <UButton
                    color="gray"
                    variant="ghost"
                    class="rounded-full p-1.5"
                    @mouseover="isShowCart = false"
                  >
                    <div class="user-avatar">
                      {{ userInitial }}
                    </div>
                  </UButton>
                </UTooltip>
              </template>
            </UDropdown>
          </template>
          <template v-else>
            <UTooltip text="Sign in">
              <UButton
                color="gray"
                variant="ghost"
                class="icon-button"
                @click="showRegisterLoginDialog"
                @mouseover="isShowCart = false"
              >
                <AppIcon name="user" />
              </UButton>
            </UTooltip>
          </template>

          <UTooltip :text="sellerCtaLabel">
            <UButton
              color="gray"
              variant="ghost"
              class="icon-button"
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

.user-avatar {
  @apply flex size-6 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700;
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
