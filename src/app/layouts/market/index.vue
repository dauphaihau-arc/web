<script setup lang="ts">
import LayoutMarketFooter from './footer.vue'
import LayoutMarketHeader from './header.vue'
import { ROUTES } from '~/shared/config/enums/routes'

const route = useRoute()

onMounted(() => {
  window.scrollTo(0, 0)
})

const linksAccountSidebar = [
  {
    label: 'Account',
    icon: 'i-heroicons-user',
    to: ROUTES.ACCOUNT,
  },
  {
    label: 'Shipping',
    icon: 'i-heroicons-map-pin',
    to: ROUTES.ACCOUNT + ROUTES.ADDRESSES,
  },
  {
    label: 'Payment',
    disabled: true,
    icon: 'i-heroicons-credit-card',
    to: ROUTES.HOME,
  },
  {
    label: 'Privacy',
    disabled: true,
    icon: 'i-heroicons-shield-check',
    to: ROUTES.HOME,
  },
  {
    label: 'Preferences',
    disabled: true,
    icon: 'i-heroicons-cog',
    to: ROUTES.HOME,
  },
]

const isAccountRoute = ref(false)

watch(() => route.path, () => {
  isAccountRoute.value = route.path.includes(ROUTES.ACCOUNT)
})
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
          :links="linksAccountSidebar"
          :ui="{
            wrapper: 'border-s border-gray-200 dark:border-gray-800 space-y-2',
            base: 'group block border-s -ms-px leading-6 before:hidden py-2 flex items-center',
            padding: 'p-0 ps-4',
            rounded: '',
            font: '',
            ring: '',
            active: 'text-primary-500 dark:text-primary-400 border-current font-semibold',
            inactive: 'border-transparent hover:border-gray-400 text-gray-700 hover:text-gray-900',
            icon: {
              base: 'text-primary-500',
              active: '!text-primary-500 dark:text-primary-400 border-current font-semibold',
              inactive: 'border-transparent hover:border-gray-400 text-gray-700 hover:text-gray-900',
            },
          }"
        >
          <template #default="{ link }">
            <span :class="link.disabled && 'opacity-50'">{{ link.label }}</span>
          </template>
          <template #icon="{ link }">
            <UIcon
              :name="link.icon"
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
