<script setup lang="ts">
import UpdateUserPreferencesBtn from './update-user-preferences-btn.vue'
import { useLocalizedRoute } from '~/shared/composables/use-localized-route'

const { t } = useI18n()
const { localizePath } = useLocalizedRoute()

const homeLink = () => localizePath('/')

const primaryLinks = computed(() => [
  {
    title: t('footer.shop.title'),
    links: [
      { title: t('footer.shop.giftCards'), link: homeLink() },
      { title: t('footer.shop.registry'), link: homeLink() },
      { title: t('footer.shop.sitemap'), link: homeLink() },
      { title: t('footer.shop.blog'), link: homeLink() },
      { title: t('footer.shop.unitedKingdom'), link: homeLink() },
      { title: t('footer.shop.germany'), link: homeLink() },
      { title: t('footer.shop.canada'), link: homeLink() },
    ],
  },
  {
    title: t('footer.sell.title'),
    links: [
      { title: t('footer.sell.sellerHandbook'), link: homeLink() },
      { title: t('footer.sell.teams'), link: homeLink() },
      { title: t('footer.sell.forums'), link: homeLink() },
      { title: t('footer.sell.affiliates'), link: homeLink() },
    ],
  },
  {
    title: t('footer.about.title'),
    links: [
      { title: t('footer.about.company'), link: homeLink() },
      { title: t('footer.about.policies'), link: homeLink() },
      { title: t('footer.about.news'), link: homeLink() },
      { title: t('footer.about.investors'), link: homeLink() },
      { title: t('footer.about.careers'), link: homeLink() },
    ],
  },
  {
    title: t('footer.support.title'),
    links: [
      { title: t('footer.support.orderStatus'), link: homeLink() },
      { title: t('footer.support.delivery'), link: homeLink() },
      { title: t('footer.support.returns'), link: homeLink() },
      { title: t('footer.support.summaryOptions'), link: homeLink() },
      { title: t('footer.support.contactUs'), link: homeLink() },
    ],
  },
])

const accordionItems = computed(() => primaryLinks.value.map(section => ({
  label: section.title,
  links: section.links,
})))

const secondaryLinks = computed(() => [
  { title: t('footer.legal.guides'), link: homeLink() },
  { title: t('footer.legal.terms'), link: homeLink() },
  { title: t('footer.legal.privacy'), link: homeLink() },
])
</script>

<template>
  <footer class="footer">
    <div class="mx-auto max-w-home-layout px-4 md:px-12 lg:px-16">
      <div class="grid grid-cols-1 gap-1 pb-0 pt-8 lg:grid-cols-5 lg:gap-32 lg:py-8">
        <div class="font-brand text-xl font-semibold text-text-strong">
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
            {{ $t('footer.copyright', { year: new Date().getFullYear() }) }}
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
