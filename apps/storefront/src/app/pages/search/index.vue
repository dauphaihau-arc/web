<script lang="ts" setup>
import SearchPageContent from './_components/search-page-content.vue'

definePageMeta({ layout: 'market' })

const route = useRoute()
const { t } = useI18n()

const searchQuery = computed(() => String(route.query.q ?? '').trim())

usePageSeo({
  area: 'search',
  title: computed(() => (
    searchQuery.value
      ? t('seo.pages.search.title', { query: searchQuery.value })
      : undefined
  )),
  description: computed(() => (
    searchQuery.value
      ? t('seo.pages.search.description', { query: searchQuery.value })
      : undefined
  )),
})

// A search listing with no keyword has nothing to describe, so the route owns
// that contract before the listing starts any request.
if (!route.query?.q) {
  throw showError({
    statusCode: 404,
    statusMessage: t('catalog.errors.pageNotFound'),
    fatal: true,
  })
}
</script>

<template>
  <SearchPageContent class="mx-auto max-w-home-layout px-4 md:px-12 lg:px-16" />
</template>
