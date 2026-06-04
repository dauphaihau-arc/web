<script lang="ts" setup>
import RecommendedProductsByCategory from './_components/recommended-products-by-category.vue'
import RecommendedProductsBySubCategories from './_components/recommended-products-by-sub-categories.vue'
import RecommendedSubCategories from './_components/recommended-sub-categories.vue'
import RootCategories from './_components/root-categories.vue'

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
