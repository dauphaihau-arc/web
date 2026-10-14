<script lang="ts" setup>
import type { Category } from '@arc/models/category'
import ProductSection from '~/domains/product/ui/product-section.vue'
import { useGetProductsByMultiQueries } from '~/domains/product/queries/products.query'

const groupSkeletons = 2
const limit = 6
const marketStore = useMarketStore()

const categories = new Map<Category['id'], Category['name']>()

const queries = computed(() => {
  if (marketStore.userActivities?.subCategoriesLastVisit) {
    return marketStore.userActivities.subCategoriesLastVisit.map((cg) => {
      categories.set(cg.id, cg.name)
      return {
        limit,
        category_id: cg.id,
      }
    })
  }
  return undefined
})

const result = useGetProductsByMultiQueries(queries.value)

watch(result, (value) => {
  const hasNotFound = value.some((entry) => {
    const error = entry.error
    const status = error?.statusCode || error?.status || error?.response?.status
    return status === 404
  })

  if (hasNotFound) {
    marketStore.clearCategoryRecommendationState()
  }
}, { deep: true })

const subCategories = computed(() => {
  const filtered = result.value.filter(value => value.status === 'success')
  if (filtered.length > 0) {
    return filtered.map(val => ({
      ...toRaw(val.data),
      categoryName: val.data?.category_id ? categories.get(val.data.category_id) : '',
    }))
  }
  return []
})
</script>

<template>
  <div>
    <!--  Skeletons loading -->
    <div
      v-if="queries && subCategories.length === 0"
      class="space-y-8 lg:space-y-12"
    >
      <ProductSection
        v-for="index in groupSkeletons"
        :key="index"
        title=""
        loading
        :limit="limit"
      />
    </div>
    <div
      v-else-if="subCategories && subCategories.length > 0"
      class="space-y-8 lg:space-y-12"
    >
      <ProductSection
        v-for="(cg, i) of subCategories"
        :key="i"
        :title="`Continue exploring ${cg.categoryName}`"
        description="Popular picks from a category you visited"
        :products="cg.items"
        :limit="limit"
      />
    </div>
  </div>
</template>
