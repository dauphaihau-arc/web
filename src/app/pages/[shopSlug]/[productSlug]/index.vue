<script lang="ts" setup>
import LoadingSvg from '~/shared/ui/loading-svg.vue'
import AddToCartForm from '~/app/components/detail-product/add-to-cart-form.vue'
import ProductImages from '~/app/components/detail-product/images.vue'
import MoreInfo from '~/app/components/detail-product/more-info.vue'
import MoreProductsByCategory from '~/app/components/detail-product/more-products-by-category.vue'
import ProductSummary from '~/app/components/detail-product/summary.vue'
import { useGetDetailProductBySlug } from '~/shared/server-state/product'

definePageMeta({ layout: 'market' })

const route = useRoute()
const marketStore = useMarketStore()

const shopSlug = route.params.shopSlug as string
const productSlug = route.params.productSlug as string

const {
  data: dataGetDetailProduct,
  isPending: isPendingGetDetailProduct,
} = useGetDetailProductBySlug(shopSlug, productSlug, {
  onResponse: ({ response }) => {
    if (response.status === 200 && response._data?.id) {
      marketStore.userActivities.categoryIdProductVisited = response._data.category_id
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
          <AddToCartForm
            v-model:inventory-selected="inventorySelected"
            :product="dataGetDetailProduct"
          />
          <MoreInfo
            :product="dataGetDetailProduct"
          />
        </div>
      </div>
      <MoreProductsByCategory
        v-if="dataGetDetailProduct.category_id"
        :category_id="dataGetDetailProduct.category_id"
      />
    </div>
  </div>
</template>
