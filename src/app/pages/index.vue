<script lang="ts" setup>
import HomeRecommendedProductsByCategory from '~/app/components/home/home-recommended-products-by-category.vue'
import HomeRecommendedProductsBySubCategories from '~/app/components/home/home-recommended-products-by-sub-categories.vue'
import HomeRecommendedSubCategories from '~/app/components/home/home-recommended-sub-categories.vue'
import HomeRootCategories from '~/app/components/home/home-root-categories.vue'

definePageMeta({ layout: 'market' })
</script>

<template>
  <div class="space-y-20 py-12">
    <HomeRecommendedProductsByCategory />
    <HomeRecommendedProductsBySubCategories />
    <HomeRecommendedSubCategories />
    <HomeRootCategories />
  </div>
</template>
