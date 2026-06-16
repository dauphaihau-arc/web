<script lang="ts" setup>
import BestSellers from './_components/best-sellers.vue'
import BecauseYouViewed from './_components/because-you-viewed.vue'
import RecentlyViewed from './_components/recently-viewed.vue'
import ContinueExploring from './_components/continue-exploring.vue'
import NewArrivals from './_components/new-arrivals.vue'
import RecommendedSubCategories from './_components/recommended-sub-categories.vue'
import RootCategories from './_components/root-categories.vue'
import TrendingNow from './_components/trending-now.vue'

definePageMeta({ layout: 'market' })
</script>

<template>
  <div class="space-y-20 py-12">
    <TrendingNow />
    <BestSellers />
    <NewArrivals />
    <RecentlyViewed />
    <BecauseYouViewed />
    <RootCategories />
    <ContinueExploring />
    <RecommendedSubCategories />
  </div>
</template>
