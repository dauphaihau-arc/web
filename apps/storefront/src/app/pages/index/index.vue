<script lang="ts" setup>
import BestSellers from './_components/best-sellers.vue'
import BecauseYouViewed from './_components/because-you-viewed.vue'
import RecentlyViewed from './_components/recently-viewed.vue'
import ContinueExploring from './_components/continue-exploring.vue'
import NewArrivals from './_components/new-arrivals.vue'
import RecommendedSubCategories from './_components/recommended-sub-categories.vue'
import RootCategories from './_components/root-categories.vue'
import TrendingNow from './_components/trending-now.vue'
import { useGetRecentlyViewedProducts } from '~/shared/server-state/product/products.query'

const recentlyViewedLimit = 10

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

definePageMeta({ layout: 'market' })
</script>

<template>
  <div class="space-y-20 py-12">
    <TrendingNow :query-options="homeSectionQueryOptions" />
    <BestSellers :query-options="homeSectionQueryOptions" />
    <NewArrivals :query-options="homeSectionQueryOptions" />
    <RecentlyViewed
      :products="recentProducts"
      :loading="isRecentlyViewedPending"
      :limit="recentlyViewedLimit"
    />
    <BecauseYouViewed
      :anchor-product="recentAnchorProduct"
      :query-options="homeSectionQueryOptions"
    />
    <RootCategories />
    <ContinueExploring />
    <RecommendedSubCategories />
  </div>
</template>
