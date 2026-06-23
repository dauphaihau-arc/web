<script setup lang="ts">
import UpdateUserPreferencesBtn from '~/app/components/dialogs/update-user-preferences-btn/update-user-preferences-btn.vue'

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

const secondaryLinks = [
  {
    title: 'Guides',
    link: '/',
  },
  {
    title: 'Terms of Sale',
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
    <div class="max-w-home-layout mx-auto">
      <div class="grid grid-cols-5 gap-32 py-8">
        <div class="text-text-strong text-xl font-semibold">
          Arc
        </div>
        <div
          v-for="(item, idx) of primaryLinks"
          :key="idx"
        >
          <div class="text-text-strong mb-3 text-sm font-semibold">
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
      <UDivider />
      <div class="flex items-center justify-between py-4">
        <UpdateUserPreferencesBtn />
        <div class="flex items-center gap-4">
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
