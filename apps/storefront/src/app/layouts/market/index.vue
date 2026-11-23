<script setup lang="ts">
import Footer from './footer/footer.vue'
import Header from './header/header.vue'
import { useAccountSidebarLinks, type AppNavigationItem } from '~/shared/navigation/menu'
import { routePaths } from '~/shared/navigation/routes'
import { useLocalizedRoute } from '~/shared/composables/use-localized-route'

const route = useRoute()
const router = useRouter()
const { t: translate } = useI18n()
const { localizePath } = useLocalizedRoute()
const accountSidebarLinks = useAccountSidebarLinks()

onMounted(() => {
  window.scrollTo(0, 0)
})

const isAccountRoute = ref(false)

/** The header slides away while scrolling down, so the sticky account tabs pin flush to the top. */
const headerVisible = useHeaderVisibility()

const accountNavTitle = computed(() => translate('header.account.tooltip'))

/**
 * Exact path match: the account root must not read as active on `/account/addresses`,
 * which a prefix-based router link class would do.
 */
function isActiveAccountLink(link: AppNavigationItem): boolean {
  const target = typeof link.to === 'string' ? link.to : router.resolve(link.to).fullPath
  const normalize = (path: string) => path.replace(/\/+$/, '')

  return normalize(route.path) === normalize(target.split('?')[0] ?? target)
}

watch(() => route.path, () => {
  isAccountRoute.value = route.path.startsWith(localizePath(routePaths.account))
}, { immediate: true })
</script>

<template>
  <div>
    <Header />

    <!-- No horizontal gutter here: pages own it, so a route change can never resize or
         re-pad the outgoing page mid-leave (that flick is why this container stayed
         full-bleed and each page carries its own max-w/gutter). -->
    <div class="layout-content pb-[500px] pt-14">
      <div
        v-if="isAccountRoute"
        class="px-4 md:px-12 lg:px-16"
      >
        <div
          class="mx-auto mt-8 flex min-h-[50vh] max-w-[900px] flex-col gap-6 lg:mt-24 lg:flex-row lg:gap-10"
        >
          <nav
            class="scrollbar-subtle sticky z-[2] -mx-4 h-fit w-full flex-none overflow-x-auto border-b border-b-border-subtle bg-surface px-4 transition-all duration-200 md:-mx-12 md:px-12 lg:top-24 lg:mx-0 lg:w-1/5 lg:self-start lg:overflow-visible lg:border-b-0 lg:bg-transparent lg:px-0"
            :class="headerVisible ? 'top-14' : 'top-0'"
            :aria-label="accountNavTitle"
          >
            <ul class="flex gap-1 lg:block lg:space-y-4">
              <li
                v-for="link in accountSidebarLinks"
                :key="String(link.to)"
                class="flex-1 lg:flex-none"
              >
                <NuxtLink
                  :to="link.to"
                  class="flex items-center justify-center whitespace-nowrap border-b-2 py-2 text-base font-semibold leading-6 transition-colors lg:justify-start lg:border-b-0 lg:py-0 lg:text-lg lg:leading-7"
                  :class="isActiveAccountLink(link)
                    ? 'border-current text-text-strong'
                    : 'border-transparent text-text-muted hover:text-text-strong'"
                >
                  {{ link.label }}
                </NuxtLink>
              </li>
            </ul>
          </nav>
          <slot />
        </div>
      </div>

      <div
        v-else
        class="min-h-[60vh]"
      >
        <slot />
      </div>
    </div>

    <Footer />
  </div>
</template>
