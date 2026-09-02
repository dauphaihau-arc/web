<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import HeaderActions from './header-actions.vue'
import Categories from './categories.vue'
import { ROUTES } from '~/shared/config/enums/routes'

const loadCartMegaMenu = () => import('./cart-mega-menu.vue')
const loadSearchAllMegaMenu = () => import('./search-all-mega-menu.vue')

const CartMegaMenu = defineAsyncComponent({
  loader: loadCartMegaMenu,
  suspensible: false,
})
const SearchAllMegaMenu = defineAsyncComponent({
  loader: loadSearchAllMegaMenu,
  suspensible: false,
})

const route = useRoute()
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
</script>

<template>
  <div>
    <header
      class="header"
      :class="{ 'hidden-header': !state.showNavbar }"
      @mouseleave="onMouseleave"
    >
      <nav class="mx-auto grid max-w-home-layout grid-cols-[1fr_auto_1fr] items-start py-3">
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

        <HeaderActions
          @close-cart="isShowCart = false"
          @close-search="isShowSearch = false"
          @preload-cart="preloadCartMegaMenu"
          @preload-search="preloadSearchAllMegaMenu"
          @toggle-cart="toggleCartMenu"
          @toggle-search="toggleSearchMenu"
        />
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

<style scoped lang="postcss">
.icon-button {
  padding: 8px;
}

.overlay {
  @apply fixed inset-0 z-[1] bg-surface-muted/75 transition-opacity;
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
