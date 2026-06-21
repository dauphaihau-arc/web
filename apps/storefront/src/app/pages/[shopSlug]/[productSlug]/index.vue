<script lang="ts" setup>
import AddToCartForm from './_components/add-to-cart-form/add-to-cart-form.vue'
import ProductImages from './_components/product-images.vue'
import MoreInfo from './_components/more-info.vue'
import ProductReviews from './_components/product-reviews/product-reviews.vue'
import ProductSummary from './_components/summary.vue'
import { useLiveProductInventory } from './_composables/use-live-product-inventory'
import RecommendationSections from './_components/recommendation-sections.vue'
import type { GetProductsResponseItem } from '~/shared/api/product/contracts/product.contract'
import { useGetDetailProductBySlug } from '~/shared/server-state/product/detail-by-slug.query'
import { useRecordProductView } from '~/shared/server-state/product/products.query'

definePageMeta({ layout: 'market' })

const route = useRoute()
const marketStore = useMarketStore()
const { mutate: recordProductView } = useRecordProductView()

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

function toRecentProductView(input: NonNullable<typeof productData.value>): GetProductsResponseItem {
  const amountValues = input.inventory
    .map(inventory => inventory.amount_minor)
    .filter((value): value is number => value != null)
  const originalAmountValues = input.inventory
    .map(inventory => inventory.original_amount_minor)
    .filter((value): value is number => value != null)
  const totalStock = input.inventory.reduce((sum, inventory) => sum + inventory.stock, 0)
  const primaryImage = input.images
    .slice()
    .sort((left, right) => left.rank - right.rank)[0]

  return {
    id: input.id,
    shop: input.shop,
    category_id: input.category_id,
    title: input.title,
    slug: input.slug,
    image: primaryImage
      ? {
          storage_key: primaryImage.storage_key,
          variant: 'original',
          variants: primaryImage.variants
            ? Object.fromEntries(
              Object.entries(primaryImage.variants).map(([variant, image]) => [
                variant,
                { storage_key: image.storage_key },
              ]),
            )
            : undefined,
        }
      : undefined,
    variant_type: input.variant_type,
    pricing: amountValues.length > 0
      ? {
          min_amount_minor: Math.min(...amountValues),
          max_amount_minor: Math.max(...amountValues),
          ...(originalAmountValues.length > 0
            ? { original_min_amount_minor: Math.min(...originalAmountValues) }
            : {}),
          ...(originalAmountValues.length > 0
            ? { original_max_amount_minor: Math.max(...originalAmountValues) }
            : {}),
          currency: input.inventory.find(inventory => inventory.currency)?.currency ?? '',
        }
      : undefined,
    availability: {
      in_stock: totalStock > 0,
      low_stock: totalStock > 0 && totalStock <= input.stock_notice_threshold,
      stock_total: totalStock,
    },
    variant_count: input.variants.length,
    has_free_shipping: input.shipping?.destinations.some(
      destination => destination.charge_type === 'free_shipping',
    ),
    created_at: new Date().toISOString(),
  }
}

watch(productData, (value) => {
  if (!import.meta.client || !value?.id) {
    return
  }

  recordProductView({
    shopSlug,
    productSlug,
  })

  marketStore.recordRecentProductView(toRecentProductView(value))
}, { immediate: true })
</script>

<template>
  <div class="mt-24">
    <div
      v-if="isPendingProduct || product"
      class="space-y-20"
    >
      <div class="mb-20 grid grid-cols-10 gap-16">
        <div class="sticky top-24 col-span-6 self-start">
          <ProductImages
            :images="product?.images"
            :is-loading="isPendingProduct"
          />
          <ProductReviews
            :shop-slug="shopSlug"
            :product-slug="productSlug"
            :is-loading="isPendingProduct && !product"
          />
        </div>
        <div class="col-span-4 space-y-6">
          <ProductSummary
            :product="product"
            :inventory-selected="selectedInventory"
            :stock-notice="stockNotice"
            :is-loading="isPendingProduct"
          />
          <AddToCartForm
            v-model:inventory-selected="inventorySelected"
            :product="product"
            :is-loading="isPendingProduct"
          />
          <MoreInfo
            :product="product"
            :is-loading="isPendingProduct"
          />
        </div>
      </div>
      <RecommendationSections
        :product-slug="productSlug"
        :shop-slug="shopSlug"
      />
    </div>
  </div>
</template>
