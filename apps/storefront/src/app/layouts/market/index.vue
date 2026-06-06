<script setup lang="ts">
import { resolveAppIconName } from '@arc/ui/app-icon.constants'
import LayoutMarketFooter from './footer.vue'
import LayoutMarketHeader from './header/index.vue'
import { accountSidebarLinks } from '~/shared/navigation/menu'
import { routePaths } from '~/shared/navigation/routes'

const route = useRoute()

onMounted(() => {
  window.scrollTo(0, 0)
})

const isAccountRoute = ref(false)

watch(() => route.path, () => {
  isAccountRoute.value = route.path.startsWith(routePaths.account)
}, { immediate: true })
</script>

<template>
  <div>
    <LayoutMarketHeader />
    <div class="max-w-home-layout mx-auto pb-[500px] pt-14">
      <div
        v-if="isAccountRoute"
        class="mx-auto mt-24 flex min-h-[50vh] max-w-[900px] gap-10"
      >
        <UVerticalNavigation
          class="h-fit w-1/5 flex-none"
          :links="accountSidebarLinks"
          :ui="{
            wrapper: 'border-s border-border-subtle space-y-2',
            base: 'group block border-s -ms-px leading-6 before:hidden py-2 flex items-center',
            padding: 'p-0 ps-4',
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
          }"
        >
          <template #default="{ link }">
            <span :class="link.disabled && 'opacity-50'">{{ link.label }}</span>
          </template>
          <template #icon="{ link }">
            <UIcon
              :name="resolveAppIconName(link.icon) ?? ''"
              :class="link.disabled && 'opacity-50'"
            />
          </template>
        </UVerticalNavigation>
        <slot />
      </div>

      <div v-else>
        <slot />
      </div>
    </div>
    <LayoutMarketFooter />
  </div>
</template>
