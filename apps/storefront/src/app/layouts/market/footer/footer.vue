<script setup lang="ts">
import UpdateUserPreferencesBtn from './update-user-preferences-btn.vue'

const primaryLinks = [
  {
    title: 'Shop',
    links: [
      {
        title: 'Gift cards',
        link: '/',
      },
      {
        title: 'Arc Registry',
        link: '/',
      },
      {
        title: 'Sitemap',
        link: '/',
      },
      {
        title: 'Arc blog',
        link: '/',
      },
      {
        title: 'Arc United Kingdom',
        link: '/',
      },
      {
        title: 'Arc Germany',
        link: '/',
      },
      {
        title: 'Arc Canada',
        link: '/',
      },
    ],
  },
  {
    title: 'Sell',
    links: [
      {
        title: 'Seller handbook',
        link: '/',
      },
      {
        title: 'Teams',
        link: '/',
      },
      {
        title: 'Forums',
        link: '/',
      },
      {
        title: 'Affiliates & Creators',
        link: '/',
      },
    ],
  },
  {
    title: 'About',
    links: [
      {
        title: 'Arc, Inc.',
        link: '/',
      },
      {
        title: 'Policies',
        link: '/',
      },
      {
        title: 'News',
        link: '/',
      },
      {
        title: 'Investors',
        link: '/',
      },
      {
        title: 'Careers',
        link: '/',
      },
    ],
  },
  {
    title: 'Support',
    links: [
      {
        title: 'Order status',
        link: '/',
      },
      {
        title: 'Delivery',
        link: '/',
      },
      {
        title: 'Returns',
        link: '/',
      },
      {
        title: 'Summary options',
        link: '/',
      },
      {
        title: 'Contact us',
        link: '/',
      },
    ],
  },
]

const accordionItems = primaryLinks.map(section => ({
  label: section.title,
  links: section.links,
}))

const secondaryLinks = [
  {
    title: 'Guides',
    link: '/',
  },
  {
    title: 'Terms of Use',
    link: '/',
  },
  {
    title: 'Privacy Policy',
    link: '/',
  },
]
</script>

<template>
  <footer class="footer">
    <div class="mx-auto max-w-home-layout px-4 md:px-12 lg:px-16">
      <div class="grid grid-cols-1 gap-1 pb-0 pt-8 lg:grid-cols-5 lg:gap-32 lg:py-8">
        <div class="text-xl font-semibold text-text-strong">
          Arc
        </div>

        <div class="lg:hidden">
          <UAccordion
            color="gray"
            variant="ghost"
            size="sm"
            :items="accordionItems"
            :ui="{
              item: {
                padding: 'pt-3 pb-3',
              },
              default: {
                class: 'mb-0 w-full rounded-none border-b border-border-subtle px-0 py-3 text-sm font-semibold text-text-strong',
              },
            }"
          >
            <template #item="{ item }">
              <div class="flex flex-col items-start gap-3">
                <ULink
                  v-for="linkItem of item.links"
                  :key="linkItem.title"
                  :to="linkItem.link"
                  class="text-sm text-text-strong
                   transition-all duration-200 hover:underline hover:opacity-90"
                >
                  {{ linkItem.title }}
                </ULink>
              </div>
            </template>
          </UAccordion>
        </div>

        <div
          v-for="(item, idx) of primaryLinks"
          :key="idx"
          class="hidden lg:block"
        >
          <div class="mb-3 text-sm font-semibold text-text-strong">
            {{ item.title }}
          </div>

          <div class="space-y-3">
            <div
              v-for="(linkItem, idxLink) of item.links"
              :key="idxLink"
            >
              <ULink
                :to="linkItem.link"
                class="text-sm text-text-strong
                 transition-all duration-200 hover:underline hover:opacity-90"
              >
                {{ linkItem.title }}
              </ULink>
            </div>
          </div>
        </div>
      </div>

      <UDivider class="hidden lg:block" />

      <div class="flex flex-col items-start gap-4 py-5 lg:flex-row lg:items-center lg:justify-between lg:py-4">
        <UpdateUserPreferencesBtn />

        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 lg:flex-nowrap">
          <div class="pt-1 text-xs">
            © {{ new Date().getFullYear() }} Arc Inc.
          </div>
          <div
            v-for="item in secondaryLinks"
            :key="item.title"
          >
            <ULink
              :to="item.link"
              class="text-xs text-text-strong
              transition-all duration-200 hover:underline hover:opacity-90"
            >
              {{ item.title }}
            </ULink>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped lang="postcss">
.footer {
  @apply absolute bottom-0 w-full bg-surface-muted
}
</style>
