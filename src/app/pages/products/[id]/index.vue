<script lang="ts" setup>
import LoadingSvg from '~/shared/ui/loading-svg.vue'
import ProductAddToCartForm from '~/app/components/detail-product/add-to-cart-form.vue'
import ProductImages from '~/app/components/detail-product/images.vue'
import ProductMoreInfo from '~/app/components/detail-product/more-info.vue'
import MoreProductsByCategory from '~/app/components/detail-product/more-products-by-category.vue'
import ProductSummary from '~/app/components/detail-product/summary.vue'
import { useGetDetailProduct } from '~/shared/server-state/product'

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
        <ProductImages
          :images="dataGetDetailProduct.images"
          class="col-span-6"
        />
        <div class="col-span-4 space-y-6">
          <ProductSummary
            :product="dataGetDetailProduct"
            :inventory-selected="inventorySelected"
          />
          <ProductAddToCartForm
            v-model:inventory-selected="inventorySelected"
            :product="dataGetDetailProduct"
          />
          <ProductMoreInfo
            :product="dataGetDetailProduct"
          />
        </div>
      </div>
      <!--      <ProductMoreProductsByShop -->
      <!--          :shop-id="dataGetDetailProduct.product.shop.id" -->
      <!--          class="mb-16" -->
      <!--      /> -->
      <MoreProductsByCategory
        v-if="dataGetDetailProduct.categoryId"
        :category-id="dataGetDetailProduct.categoryId"
      />
    </div>
  </div>
</template>
