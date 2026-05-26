<script lang="ts" setup>
import { ProductVariantTypes } from '@arc/enums/product'
import LoadingSvg from '~/shared/ui/loading-svg.vue'
import AddToCartForm from '~/app/components/detail-product/add-to-cart-form.vue'
import ProductImages from '~/app/components/detail-product/images.vue'
import MoreInfo from '~/app/components/detail-product/more-info.vue'
import MoreProductsByCategory from '~/app/components/detail-product/more-products-by-category.vue'
import ProductSummary from '~/app/components/detail-product/summary.vue'
import type { ProductInventoryUpdatedRealtimeEvent } from '~/shared/realtime/product-inventory-events'
import { createProductInventoryEventsClient } from '~/shared/realtime/product-inventory-events.client'
import { useGetDetailProductBySlug } from '~/shared/server-state/product/detail-by-slug.query'
import { getProductStockNotice, PRODUCT_STOCK_NOTICE_THRESHOLD } from '~/shared/utils/product-stock'

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
const inventoryStockById = ref<Record<string, number>>({})
const backInStockInventoryId = ref<string | null>(null)

const liveProduct = computed(() => {
  const product = dataGetDetailProduct.value

  if (!product) {
    return product
  }

  return {
    ...product,
    inventory: product.inventory.map(inventory => ({
      ...inventory,
      stock: inventoryStockById.value[inventory.id] ?? inventory.stock,
    })),
  }
})

const resolvedProduct = computed(() => liveProduct.value ?? dataGetDetailProduct.value)

const liveInventorySelected = computed(() => {
  const selectedInventoryId = inventorySelected.value?.id

  if (!selectedInventoryId) {
    return inventorySelected.value
  }

  return liveProduct.value?.inventory.find(inventory => inventory.id === selectedInventoryId)
    ?? inventorySelected.value
})

const activeInventory = computed(() => {
  if (liveInventorySelected.value) {
    return liveInventorySelected.value
  }

  if (liveProduct.value?.variant_type === ProductVariantTypes.NONE) {
    return liveProduct.value.inventory[0]
  }

  return undefined
})

const stockNotice = computed(() => {
  const inventory = activeInventory.value

  if (!inventory) {
    return ''
  }

  return getProductStockNotice(inventory.stock, {
    backInStock: backInStockInventoryId.value === inventory.id,
  })
})

const shouldSubscribeToInventoryEvents = computed(() => {
  const product = liveProduct.value

  if (!product) {
    return false
  }

  if (activeInventory.value) {
    return activeInventory.value.stock < PRODUCT_STOCK_NOTICE_THRESHOLD
  }

  return product.inventory.some(inventory => inventory.stock < PRODUCT_STOCK_NOTICE_THRESHOLD)
})

let productInventoryEventsClient: ReturnType<typeof createProductInventoryEventsClient> | null = null

function handleInventoryUpdated(payload: ProductInventoryUpdatedRealtimeEvent) {
  const currentStock = inventoryStockById.value[payload.inventoryId]
    ?? dataGetDetailProduct.value?.inventory.find(inventory => inventory.id === payload.inventoryId)?.stock

  inventoryStockById.value = {
    ...inventoryStockById.value,
    [payload.inventoryId]: payload.stock,
  }

  if (currentStock === 0 && payload.stock > 0) {
    backInStockInventoryId.value = payload.inventoryId
    return
  }

  if (backInStockInventoryId.value === payload.inventoryId) {
    backInStockInventoryId.value = null
  }
}

if (import.meta.client) {
  productInventoryEventsClient = createProductInventoryEventsClient(handleInventoryUpdated)

  watch(
    () => [liveProduct.value?.id, shouldSubscribeToInventoryEvents.value] as const,
    ([productId, shouldSubscribe]) => {
      if (!productId || !shouldSubscribe) {
        productInventoryEventsClient?.stop()
        return
      }

      productInventoryEventsClient?.start(productId)
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    productInventoryEventsClient?.stop()
  })
}

watch(
  () => activeInventory.value?.id,
  (inventoryId) => {
    if (inventoryId !== backInStockInventoryId.value) {
      backInStockInventoryId.value = null
    }
  },
)
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
      v-else-if="resolvedProduct"
      class="space-y-20"
    >
      <div class="mb-20 grid grid-cols-10">
        <ProductImages
          :images="resolvedProduct.images"
          class="col-span-6"
        />
        <div class="col-span-4 space-y-6">
          <ProductSummary
            :product="resolvedProduct"
            :inventory-selected="liveInventorySelected"
            :stock-notice="stockNotice"
          />
          <AddToCartForm
            v-model:inventory-selected="inventorySelected"
            :product="resolvedProduct"
          />
          <MoreInfo
            :product="resolvedProduct"
          />
        </div>
      </div>
      <MoreProductsByCategory
        v-if="resolvedProduct.category_id"
        :category_id="resolvedProduct.category_id"
      />
    </div>
  </div>
</template>
