<script lang="ts" setup>
import { useGetDetailProduct } from '~/shared/services/product'

definePageMeta({ layout: 'market' })

const route = useRoute()
const marketStore = useMarketStore()

const productId = route.params.id as string

const {
  data: dataGetDetailProduct,
  isPending: isPendingGetDetailProduct,
} = useGetDetailProduct(productId, {
  onResponse: ({ response }) => {
    if (response.status === 200 && response._data?.id) {
      marketStore.userActivities.categoryIdProductVisited = response._data.categoryId
    }
    else {
      throw showError({
        statusCode: 404,
        statusMessage: 'Product Not Found',
        fatal: true,
      })
    }
  },
})

const inventorySelected = ref()
</script>

<template>
  <div class="mt-24">
    <div
      v-if="isPendingGetDetailProduct"
      class="grid h-[80vh] w-full place-content-center"
    >
      <LoadingSvg :child-class="'!w-12 !h-12'" />
    </div>
    <div
      v-else-if="dataGetDetailProduct"
      class="space-y-20"
    >
      <div class="mb-20 grid grid-cols-10">
        <DetailProductImages
          :images="dataGetDetailProduct.images"
          class="col-span-6"
        />
        <div class="col-span-4 space-y-6">
          <DetailProductSummary
            :product="dataGetDetailProduct"
            :inventory-selected="inventorySelected"
          />
          <DetailProductAddToCartForm
            v-model:inventory-selected="inventorySelected"
            :product="dataGetDetailProduct"
          />
          <DetailProductMoreInfo
            :product="dataGetDetailProduct"
          />
        </div>
      </div>
      <!--      <DetailProductMoreProductsByShop -->
      <!--          :shop-id="dataGetDetailProduct.product.shop.id" -->
      <!--          class="mb-16" -->
      <!--      /> -->
      <DetailProductMoreProductsByCategory
        v-if="dataGetDetailProduct.categoryId"
        :category-id="dataGetDetailProduct.categoryId"
      />
    </div>
  </div>
</template>
