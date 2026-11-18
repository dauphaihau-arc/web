<script lang="ts" setup>
import CategoryPageContent from './_components/category-page-content.vue'
import { useResolvedCategory } from '~/domains/category/queries/category-resolution.query'
import { CATEGORY_ROUTE_PARAM, parseCategorySegment } from '~/shared/navigation/route-paths'

definePageMeta({ layout: 'market', middleware: 'category' })

const route = useRoute()
const { t } = useI18n()

// Identity is parsed from the URL and resolved by the `category` middleware
// during SSR/navigation before this page renders; the resolution is read back
// from the same query cache entry, so the container only starts products and
// facets once a visible category has been resolved.
const publicId = computed(() => parseCategorySegment(route.params[CATEGORY_ROUTE_PARAM])?.publicId)
const { data: resolution } = useResolvedCategory(publicId)

const categoryName = computed(() => resolution.value?.category.name)

usePageSeo({
  area: 'category',
  title: computed(() => (
    categoryName.value
      ? t('seo.pages.category.title', { name: categoryName.value })
      : undefined
  )),
  description: computed(() => (
    categoryName.value
      ? t('seo.pages.category.description', { name: categoryName.value })
      : undefined
  )),
  // The resolver returns a language-neutral canonical path; `usePageSeo`
  // applies the active locale prefix, so `/vi/c/...` never canonicalizes to
  // its unprefixed English counterpart.
  canonicalPath: computed(() => resolution.value?.canonicalPath),
})
</script>

<template>
  <CategoryPageContent
    :resolution="resolution"
    class="mx-auto max-w-home-layout px-4 md:px-12 lg:px-16"
  />
</template>
