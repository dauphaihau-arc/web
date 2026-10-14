<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import HeaderActions from './header-actions.vue'
import Categories from './categories.vue'
import ScreenPanel from './screen-panel.vue'
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

/** `lg` breakpoint: below it the megamenus are replaced by full-screen panels. */
const isDesktop = useMediaQuery('(min-width: 1024px)')

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
  // Below `lg` both menus are modal panels that cover the header, so pointer
  // movement (including the synthetic leave a covering layer causes) must not close them.
  if (!isDesktop.value) {
    return
  }

  isShowSearch.value = false
  isShowCart.value = false
}

const OFFSET = 60

const headerVisible = useHeaderVisibility()

const state = reactive({
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
  headerVisible.value = window.pageYOffset < state.lastScrollPosition
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
      :class="{ 'hidden-header': !headerVisible }"
      @mouseleave="onMouseleave"
    >
      <nav
        class="mx-auto grid max-w-home-layout grid-cols-[1fr_auto_1fr] items-start px-4 py-3 md:px-12 lg:px-16"
      >
        <NuxtLink
          id="brand"
          :to="ROUTES.HOME"
          class="-ms-1 h-fit p-1 text-xl font-bold"
        >
          Arc
        </NuxtLink>

        <div class=" justify-self-center">
          <Categories class="mx-3 hidden lg:block" />
          <CartMegaMenu
            v-if="hasLoadedCartMegaMenu && isDesktop"
            :show="isShowCart"
            class="mt-8"
          />
          <SearchAllMegaMenu
            v-if="hasLoadedSearchAllMegaMenu && isDesktop"
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

    <ScreenPanel
      v-if="hasLoadedSearchAllMegaMenu && !isDesktop"
      v-model="isShowSearch"
      close-label="Close search"
      close-test-id="header-search-close"
    >
      <SearchAllMegaMenu
        :show="true"
        variant="screen"
      />
    </ScreenPanel>

    <ScreenPanel
      v-if="hasLoadedCartMegaMenu && !isDesktop"
      v-model="isShowCart"
      close-label="Close cart"
      close-test-id="header-cart-close"
    >
      <CartMegaMenu
        :show="true"
        variant="screen"
      />
    </ScreenPanel>

    <transition
      enter-class="ease-out duration-500"
      enter-to-class="opacity-100"
      enter-active-class="opacity-0"
      leave-class="ease-in duration-500"
      leave-active-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="(isShowCart || isShowSearch) && isDesktop"
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
  @apply fixed inset-x-0 top-0 z-[3] bg-surface border-b border-b-border-subtle;
  transform: translate3d(0, 0, 0);
  transition: 0.1s all ease-out;
}

.header.hidden-header {
  transform: translate3d(0, -100%, 0);
}
</style>
