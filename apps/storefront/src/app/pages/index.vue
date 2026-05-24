<script lang="ts" setup>
import RecommendedProductsByCategory from '~/app/components/home/recommended-products-by-category.vue'
import RecommendedProductsBySubCategories from '~/app/components/home/recommended-products-by-sub-categories.vue'
import RecommendedSubCategories from '~/app/components/home/recommended-sub-categories.vue'
import RootCategories from '~/app/components/home/root-categories.vue'

definePageMeta({ layout: 'market' })
</script>

<template>
  <div class="space-y-20 py-12">
    <RecommendedProductsByCategory />
    <RecommendedProductsBySubCategories />
    <RecommendedSubCategories />
    <RootCategories />
  </div>
</template>
