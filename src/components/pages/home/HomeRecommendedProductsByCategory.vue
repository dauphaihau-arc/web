<script lang="ts" setup>
import { useGetProducts } from '~/services/product';

const limit = 10;
const marketStore = useMarketStore();

const params = computed(() => {
  if (marketStore.userActivities.categoryIdProductVisited) {
    return {
      category_id: marketStore.userActivities.categoryIdProductVisited,
      limit,
    };
  }
  return undefined;
});

const {
  data,
  error,
  isPending: isPendingGetProducts,
} = useGetProducts(params);

watch(error, (value) => {
  const status = value?.statusCode || value?.status || value?.response?.status;
  if (status === 404) {
    marketStore.clearCategoryRecommendationState();
  }
});
</script>

<template>
  <div v-if="params">
    <div>
      <h3 class="mb-3 text-lg font-medium">
        Recently viewed & more
      </h3>
      <div>
        <div
          v-if="isPendingGetProducts"
          class="grid grid-cols-5 gap-4"
        >
          <div
            v-for="index in limit"
            :key="index"
          >
            <USkeleton class="h-[160px]" />
          </div>
        </div>
        <div
          v-else-if="data?.results && data.results.length > 0"
          class="grid grid-cols-5 gap-4"
        >
          <div
            v-for="(product, i) of data.results"
            :key="i"
          >
            <HomeProductCard :product="product" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
