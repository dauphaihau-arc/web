<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { useGetCart } from '~/domains/cart/queries/cart.query'
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query'
import { hasAdminRole, hasCustomerAccess, hasSellerAccess } from '~/domains/auth/utils/seller-access'

const emit = defineEmits<{
  closeCart: []
  closeSearch: []
  preloadCart: []
  preloadSearch: []
  toggleCart: []
  toggleSearch: []
}>()

const loadAccountDropdown = () => import('./account-dropdown.vue')
const loadNotificationPopover = () => import('./notification-popover.vue')

const AccountDropdown = defineAsyncComponent({
  loader: loadAccountDropdown,
  suspensible: false,
})
const NotificationPopover = defineAsyncComponent({
  loader: loadNotificationPopover,
  suspensible: false,
})

const modal = useModal()
const config = useRuntimeConfig()

const {
  data: dataGetCart,
} = useGetCart()

const {
  data: dataUserAuth,
  isPending: isPendingUserAuth,
} = useGetCurrentUser()

const totalProductCarts = computed(() => {
  return dataGetCart.value?.cart?.total_quantity ?? 0
})

const isAdminUser = computed(() => hasAdminRole(dataUserAuth.value?.user))

const sellerCtaLabel = computed(() => {
  if (!dataUserAuth.value?.user) {
    return 'Seller Center'
  }

  return hasSellerAccess(dataUserAuth.value.user) ? 'Manage Shop' : 'Start Selling'
})

const hasCustomerAccountAccess = computed(() => hasCustomerAccess(dataUserAuth.value?.user))

function preloadAuthMenu() {
  void loadNotificationPopover()
  void loadAccountDropdown()
}

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

async function showRegisterLoginDialog(): Promise<void> {
  const dialog = await import('~/domains/auth/ui/login-register/register-login-dialog.vue')
  modal.open(dialog.default)
}

function handleSearchHover() {
  emit('preloadSearch')
  emit('closeCart')
}

function handleCartHover() {
  emit('preloadCart')
  emit('closeSearch')
}
</script>

<template>
  <div class="flex h-fit items-center gap-2 justify-self-end">
    <UTooltip text="Search">
      <UButton
        square
        color="gray"
        variant="ghost"
        @click="emit('toggleSearch')"
        @mouseover="handleSearchHover"
        @focus="emit('preloadSearch')"
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
      <template v-else-if="hasCustomerAccountAccess">
        <NotificationPopover @mouseenter="preloadAuthMenu" />
        <AccountDropdown
          @hover-trigger="emit('closeCart')"
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
            @mouseover="emit('closeCart')"
          >
            <AppIcon name="user" />
          </UButton>
        </UTooltip>
      </template>
    </ClientOnly>

    <UTooltip
      v-if="!isAdminUser"
      :text="sellerCtaLabel"
    >
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
        @click="emit('toggleCart')"
        @mouseover="handleCartHover"
      >
        <UButton
          id="cart-btn"
          data-testid="header-cart-trigger"
          square
          variant="ghost"
          color="gray"
          @click.stop="emit('toggleCart')"
          @mouseover="handleCartHover"
          @focus="emit('preloadCart')"
        >
          <AppIcon name="cart" />
        </UButton>
      </UChip>
    </UTooltip>
  </div>
</template>
