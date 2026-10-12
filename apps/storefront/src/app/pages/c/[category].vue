<script lang="ts" setup>
import CategoryPageContent from './_components/category-page-content.vue'
import { useResolvedCategory } from '~/domains/category/queries/category-resolution.query'
import { CATEGORY_ROUTE_PARAM, parseCategorySegment } from '~/shared/navigation/route-paths'

definePageMeta({ layout: 'market', middleware: 'category' })

const route = useRoute()

// Identity is parsed from the URL and resolved by the `category` middleware
// during SSR/navigation before this page renders; the resolution is read back
// from the same query cache entry, so the container only starts products and
// facets once a visible category has been resolved.
const publicId = computed(() => parseCategorySegment(route.params[CATEGORY_ROUTE_PARAM])?.publicId)
const { data: resolution } = useResolvedCategory(publicId)

useHead(() => ({
  link: resolution.value?.canonicalPath
    ? [{ rel: 'canonical', href: resolution.value.canonicalPath }]
    : [],
}))
</script>

<template>
  <CategoryPageContent :resolution="resolution" />
</template>
