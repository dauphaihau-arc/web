<script setup lang="ts">
import type { Product } from '~/shared/models/product'
import { useShopGetProducts } from '~/shared/server-state/shop/product/list.query'
import type { ListShopProductsItem, ListShopProductsRequest } from '~/shared/api/shop/product/list'

type ProductCouponRow = ListShopProductsItem & {
  lowestPrice: number
  highestPrice: number
  stock: number
}

const productIdsModel = defineModel<Product['id'][]>()

const isOpen = ref(false)
const selectedRows = ref<ProductCouponRow[]>([])
const page = ref(1)
const search = ref()

const params = ref<ListShopProductsRequest>({
  page: page.value,
  limit: 5,
})

const {
  isPending: isPendingShopGetProducts,
  data: dataShopGetProducts,
  refetch: refetchShopGetProducts,
} = useShopGetProducts(params)

defineShortcuts({
  escape: {
    usingInput: true,
    whenever: [isOpen],
    handler: () => { isOpen.value = false },
  },
})

const columnsDialog = [
  {
    key: 'title',
    label: 'Title',
  },
  {
    key: 'price',
    label: 'Price',
    class: 'text-left',
  }, {
    key: 'stock',
    label: 'Stock',
    class: 'text-center',
  },
]

const columnsPreviewTable = [
  ...columnsDialog,
  {
    key: 'actions',
    label: 'Actions',
    class: 'text-center',
  },
]

const rowsDialog = computed<ProductCouponRow[]>(() => {
  if (!dataShopGetProducts.value) {
    return []
  }

  return dataShopGetProducts.value.items.map((prod) => {
    const inventory = [...toRaw(prod.inventory)].sort((a, b) => a.price - b.price)

    return {
      ...prod,
      lowestPrice: inventory[0]?.price ?? 0,
      highestPrice: inventory.length > 1 ? inventory[inventory.length - 1].price : 0,
      stock: inventory.reduce((acc, next) => acc + next.stock, 0),
    }
  })
})

const applyProducts = () => {
  productIdsModel.value = selectedRows.value.map(prod => prod.id)
  isOpen.value = false
}

const removeProduct = (id: Product['id']) => {
  selectedRows.value = selectedRows.value.filter(row => row.id !== id)
  if (productIdsModel.value) {
    productIdsModel.value = productIdsModel.value.filter(productId => productId !== id)
  }
}

watchDebounced(
  search,
  () => {
    if (!search.value) {
      delete params.value.title
    }
    else params.value.title = search.value
    refetchShopGetProducts()
  },
  { debounce: 500, maxWait: 1000 },
)
</script>

<template>
  <div>
    <UButton
      color="gray"
      variant="solid"
      @click="isOpen = true"
    >
      Add product
    </UButton>

    <UModal
      v-model="isOpen"
      :ui="{ width: 'min-w-[800px]' }"
    >
      <div class="space-y-5 p-6">
        <h1 class="text-xl font-medium">
          Select Products
        </h1>

        <UInput
          v-model="search"
          icon="i-heroicons-magnifying-glass-20-solid"
          placeholder="Title product..."
          class="w-1/2"
          size="lg"
          :ui="{
            size: {
              xl: 'text-2xl',
            },
          }"
        />
        <UTable
          v-model="selectedRows"
          class="min-h-[315px]"
          :rows="rowsDialog"
          :columns="columnsDialog"
          :loading="isPendingShopGetProducts"
          :loading-state="{ icon: 'i-heroicons-arrow-path-20-solid', label: 'Loading...' }"
        >
          <template #price-data="{ row }">
            <div>
              {{ formatCurrency(row.lowestPrice) }}
              {{ row.highestPrice > 0 ? `- ${formatCurrency(row.highestPrice)}` : '' }}
            </div>
          </template>
          <template #stock-data="{ row }">
            <div class="text-center">
              {{ row.stock }}
            </div>
          </template>
        </UTable>

        <div class="flex items-center justify-end gap-2">
          <UButton
            size="sm"
            color="gray"
            @click="() => isOpen = false"
          >
            Cancel
          </UButton>
          <UButton
            size="sm"
            @click="applyProducts"
          >
            Save
          </UButton>
        </div>
      </div>
    </UModal>

    <div v-if="selectedRows.length > 0">
      <UTable
        :columns="columnsPreviewTable"
        :rows="selectedRows"
        :loading-state="{ icon: 'i-heroicons-arrow-path-20-solid', label: 'Loading...' }"
      >
        <template #price-data="{ row }">
          <div>
            {{ formatCurrency(row.lowestPrice) }}
            {{ row.highestPrice > 0 ? `- ${formatCurrency(row.highestPrice)}` : '' }}
          </div>
        </template>

        <template #stock-data="{ row }">
          <div class="text-center">
            {{ row.stock }}
          </div>
        </template>

        <template #actions-data="{ row }">
          <div class="text-center">
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-trash"
              @click="() => removeProduct(row.id)"
            />
          </div>
        </template>
      </UTable>
    </div>
  </div>
</template>
