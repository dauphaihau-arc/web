<script lang="ts" setup>
import TrendingNow from './_components/trending-now.vue'
import { prefetchTrendingProducts, useGetRecentlyViewedProducts } from '~/domains/product/queries/products.query'

// Below the first rail nothing is above the fold. Defer both the chunk and the
// hydration until a section scrolls into view, so the home route does not ship
// all eight section implementations and their query setup up front.
const LazyBestSellers = defineLazyHydrationComponent('visible', () => import('./_components/best-sellers.vue'))
const LazyNewArrivals = defineLazyHydrationComponent('visible', () => import('./_components/new-arrivals.vue'))
const LazyRecentlyViewed = defineLazyHydrationComponent('visible', () => import('./_components/recently-viewed.vue'))
const LazyBecauseYouViewed = defineLazyHydrationComponent('visible', () => import('./_components/because-you-viewed.vue'))
const LazyRootCategories = defineLazyHydrationComponent('visible', () => import('./_components/root-categories.vue'))
const LazyContinueExploring = defineLazyHydrationComponent('visible', () => import('./_components/continue-exploring.vue'))
const LazyRecommendedSubCategories = defineLazyHydrationComponent('visible', () => import('./_components/recommended-sub-categories.vue'))

const recentlyViewedLimit = 10
const trendingLimit = 10

const homeSectionQueryOptions = {
  staleTime: 60_000,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
} as const

const { data: recentlyViewed, isPending: isRecentlyViewedPending } = useGetRecentlyViewedProducts(
  computed(() => ({ limit: recentlyViewedLimit })),
  homeSectionQueryOptions,
)
const recentProducts = computed(() => recentlyViewed.value?.items)
const recentAnchorProduct = computed(() => recentProducts.value?.[0])

// The first rail holds the LCP candidate. Prefetching on the server puts the
// card images in the initial HTML and lets the dehydrated query cache serve the
// client render, so the image is discovered with the document instead of after
// hydration plus a client API round trip. A slow API must not hold the whole
// page: the client query takes over when this budget expires.
if (import.meta.server) {
  await Promise.race([
    prefetchTrendingProducts(useQueryClient(), trendingLimit),
    new Promise<void>(resolve => setTimeout(resolve, 2500)),
  ]).catch(() => {})
}

definePageMeta({ layout: 'market' })
</script>

<template>
  <div class="space-y-10 py-6 sm:space-y-14 sm:py-8 lg:space-y-20 lg:py-12">
    <TrendingNow
      :query-options="homeSectionQueryOptions"
      :limit="trendingLimit"
    />
    <LazyBestSellers
      :query-options="homeSectionQueryOptions"
    />
    <LazyNewArrivals
      :query-options="homeSectionQueryOptions"
    />
    <LazyRecentlyViewed
      :products="recentProducts"
      :loading="isRecentlyViewedPending"
      :limit="recentlyViewedLimit"
    />
    <LazyBecauseYouViewed
      :anchor-product="recentAnchorProduct"
      :query-options="homeSectionQueryOptions"
    />
    <LazyRootCategories />
    <LazyContinueExploring />
    <LazyRecommendedSubCategories />
  </div>
</template>
