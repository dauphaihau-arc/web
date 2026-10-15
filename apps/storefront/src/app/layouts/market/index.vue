<script setup lang="ts">
import Footer from './footer/footer.vue'
import Header from './header/header.vue'
import { accountSidebarLinks } from '~/shared/navigation/menu'
import { routePaths } from '~/shared/navigation/routes'

const route = useRoute()

onMounted(() => {
  window.scrollTo(0, 0)
})

const isAccountRoute = ref(false)
const isHomeRoute = computed(() => route.path === routePaths.home)

/** The header slides away while scrolling down, so the sticky account tabs pin flush to the top. */
const headerVisible = useHeaderVisibility()

/**
 * Below `lg` the account nav is a sticky horizontal tab strip. The component
 * root is the padded bar; its inner list holds the links, so the row layout is
 * applied there. From `lg` it stays the vertical sidebar beside the content.
 */
const accountNavUi = {
  wrapper: 'border-b border-border-subtle [&>ul]:flex [&>ul]:gap-1 [&>ul>li]:flex-1 lg:space-y-2 lg:border-b-0 lg:border-s lg:[&>ul]:block',
  base: 'group flex shrink-0 items-center justify-center whitespace-nowrap border-b-2 leading-6 before:hidden py-2 lg:justify-start lg:border-b-0 lg:border-s lg:-ms-px',
  padding: 'p-0 px-1 lg:px-0 lg:ps-4',
  rounded: '',
  font: '',
  ring: '',
  active: 'text-primary-500 dark:text-primary-400 border-current font-semibold',
  inactive: 'border-transparent hover:border-border-hover text-text-subtle hover:text-text-strong',
  icon: {
    base: 'text-primary-500',
    active: '!text-primary-500 dark:text-primary-400 border-current font-semibold',
    inactive: 'border-transparent hover:border-border-hover text-text-subtle hover:text-text-strong',
  },
}

watch(() => route.path, () => {
  isAccountRoute.value = route.path.startsWith(routePaths.account)
}, { immediate: true })
</script>

<template>
  <div>
    <Header />

    <div
      class="pb-[500px] pt-14"
      :class="isHomeRoute ? '' : 'mx-auto max-w-home-layout px-4 md:px-12 lg:px-16'"
    >
      <div
        v-if="isAccountRoute"
        class="mx-auto mt-8 flex min-h-[50vh] max-w-[900px] flex-col gap-6 lg:mt-24 lg:flex-row lg:gap-10"
      >
        <UVerticalNavigation
          class="scrollbar-subtle sticky z-[2] -mx-4 h-fit w-full flex-none overflow-x-auto bg-surface px-4 transition-all duration-200 md:-mx-12 md:px-12 lg:static lg:mx-0 lg:w-1/5 lg:overflow-visible lg:bg-transparent lg:px-0"
          :class="headerVisible ? 'top-14' : 'top-0'"
          :links="accountSidebarLinks"
          :ui="accountNavUi"
        >
          <template #default="{ link }">
            <span :class="link.disabled && 'opacity-50'">{{ link.label }}</span>
          </template>
          <template #icon="{ link }">
            <AppIcon
              :name="link.icon ?? ''"
              :class="link.disabled && 'opacity-50'"
            />
          </template>
        </UVerticalNavigation>
        <slot />
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
