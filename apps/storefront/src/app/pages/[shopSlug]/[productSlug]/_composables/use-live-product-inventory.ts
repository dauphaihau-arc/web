import type { ComputedRef, Ref } from 'vue'
import {
  computed, onBeforeUnmount, ref, watch,
} from 'vue'
import { ProductVariantTypes } from '@arc/enums/product'
import type { GetDetailProductBySlugResponse } from '~/shared/api/product/contracts/product.contract'
import type { ProductInventoryUpdatedRealtimeEvent } from '~/shared/realtime/product-inventory-events'
import { createProductInventoryEventsClient } from '~/shared/realtime/product-inventory-events.client'
import { getProductStockNotice, PRODUCT_STOCK_NOTICE_THRESHOLD } from '~/shared/utils/product-stock'

type UseLiveProductInventoryReturn = {
  inventorySelected: Ref<GetDetailProductBySlugResponse['inventory'][number] | undefined>
  product: ComputedRef<GetDetailProductBySlugResponse | undefined>
  selectedInventory: ComputedRef<GetDetailProductBySlugResponse['inventory'][number] | undefined>
  stockNotice: ComputedRef<string>
}

export function useLiveProductInventory(
  sourceProduct: Ref<GetDetailProductBySlugResponse | undefined>,
): UseLiveProductInventoryReturn {
  const inventorySelected = ref<GetDetailProductBySlugResponse['inventory'][number]>()
  const inventoryStockById = ref<Record<string, number>>({})
  const backInStockInventoryId = ref<string | null>(null)

  const product = computed<GetDetailProductBySlugResponse | undefined>(() => {
    const currentProduct = sourceProduct.value

    if (!currentProduct) {
      return undefined
    }

    return {
      ...currentProduct,
      inventory: currentProduct.inventory.map(inventory => ({
        ...inventory,
        stock: inventoryStockById.value[inventory.id] ?? inventory.stock,
      })),
    }
  })

  const selectedInventory = computed<GetDetailProductBySlugResponse['inventory'][number] | undefined>(() => {
    const selectedInventoryId = inventorySelected.value?.id

    if (selectedInventoryId) {
      return product.value?.inventory.find(inventory => inventory.id === selectedInventoryId)
        ?? inventorySelected.value
    }

    if (product.value?.variant_type === ProductVariantTypes.NONE) {
      return product.value.inventory[0]
    }

    return inventorySelected.value
  })

  const stockNotice = computed(() => {
    const inventory = selectedInventory.value

    if (!inventory) {
      return ''
    }

    return getProductStockNotice(inventory.stock, {
      backInStock: backInStockInventoryId.value === inventory.id,
    })
  })

  const shouldSubscribeToInventoryEvents = computed(() => {
    const currentProduct = product.value

    if (!currentProduct) {
      return false
    }

    if (selectedInventory.value) {
      return selectedInventory.value.stock < PRODUCT_STOCK_NOTICE_THRESHOLD
    }

    return currentProduct.inventory.some(inventory => inventory.stock < PRODUCT_STOCK_NOTICE_THRESHOLD)
  })

  function handleInventoryUpdated(payload: ProductInventoryUpdatedRealtimeEvent) {
    const currentStock = inventoryStockById.value[payload.inventoryId]
      ?? sourceProduct.value?.inventory.find(inventory => inventory.id === payload.inventoryId)?.stock

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
    const productInventoryEventsClient = createProductInventoryEventsClient(handleInventoryUpdated)

    watch(
      () => [product.value?.id, shouldSubscribeToInventoryEvents.value] as const,
      ([productId, shouldSubscribe]) => {
        if (!productId || !shouldSubscribe) {
          productInventoryEventsClient.stop()
          return
        }

        productInventoryEventsClient.start(productId)
      },
      { immediate: true },
    )

    onBeforeUnmount(() => {
      productInventoryEventsClient.stop()
    })
  }

  watch(
    () => selectedInventory.value?.id,
    (inventoryId) => {
      if (inventoryId !== backInStockInventoryId.value) {
        backInStockInventoryId.value = null
      }
    },
  )

  return {
    inventorySelected,
    product,
    selectedInventory,
    stockNotice,
  }
}
