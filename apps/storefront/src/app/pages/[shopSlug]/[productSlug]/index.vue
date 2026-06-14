<script lang="ts" setup>
import LoadingSvg from '@arc/ui/loading-svg.vue'
import AddToCartForm from './_components/add-to-cart-form.vue'
import ProductImages from './_components/product-images.vue'
import MoreInfo from './_components/more-info.vue'
import MoreProductsByCategory from './_components/more-products-by-category.vue'
import ProductSummary from './_components/summary.vue'
import { useLiveProductInventory } from './_composables/use-live-product-inventory'
import { useGetDetailProductBySlug } from '~/shared/server-state/product/detail-by-slug.query'

definePageMeta({ layout: 'market' })

const route = useRoute()
const marketStore = useMarketStore()

const shopSlug = route.params.shopSlug as string
const productSlug = route.params.productSlug as string

const {
  data: productData,
  isPending: isPendingProduct,
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

const {
  inventorySelected,
  product,
  selectedInventory,
  stockNotice,
} = useLiveProductInventory(productData)
</script>

<template>
  <div class="mt-24">
    <div
      v-if="isPendingProduct"
      class="grid h-[80vh] w-full place-content-center"
    >
      <LoadingSvg :child-class="'!w-12 !h-12'" />
    </div>
    <div
      v-else-if="product"
      class="space-y-20"
    >
      <div class="mb-20 grid grid-cols-10">
        <ProductImages
          :images="product.images"
          class="sticky top-24 col-span-6 self-start"
        />
        <div class="col-span-4 space-y-6">
          <ProductSummary
            :product="product"
            :inventory-selected="selectedInventory"
            :stock-notice="stockNotice"
          />
          <AddToCartForm
            v-model:inventory-selected="inventorySelected"
            :product="product"
          />
          <MoreInfo
            :product="product"
          />
        </div>
      </div>
      <MoreProductsByCategory
        v-if="product.category_id"
        :category-id="product.category_id"
      />
    </div>
  </div>
</template>
