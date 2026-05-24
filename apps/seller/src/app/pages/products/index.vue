<script lang="ts" setup>
import { ProductStates, ProductVariantTypes } from '@arc/enums/product'
import type { ElementType } from '@arc/contracts/utils'
import type { DropdownItem } from '#ui/types'
import LoadingSvg from '~/shared/ui/loading-svg.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import FixedPagination from '~/app/components/account/shop/fixed-pagination.vue'
import { ROUTES } from '~/shared/config/enums/routes'
import { routes } from '~/shared/navigation/routes'
import type { ListShopProductsItem } from '~/shared/api/shop/product/contracts/read.contract'
import { useShopDeleteProduct } from '~/shared/server-state/shop/product/delete-product.mutation'
import { useShopGetProducts } from '~/shared/server-state/shop/product/list.query'
import { useGetMyShop } from '~/shared/server-state/shop/my-shop.query'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

type ProductRow = {
  id: string
  slug: string
  title: string
  state?: ProductStates
  imageUrl: string
  variants: ListShopProductsItem['variants']
  inventory: ListShopProductsItem['inventory']
  variantType: ProductVariantTypes
}

type ProductVariantRow = ProductRow['variants'][number]

const selected = ref([])
const pageCount = 20
const page = ref(1)

const params = computed(() => ({
  page: page.value,
  limit: pageCount,
}))

const {
  isPending: isPendingShopGetProducts,
  data: dataShopGetProducts,
  refetch,
} = useShopGetProducts(params)

const { data: dataMyShop } = useGetMyShop()

const { mutateAsync: deleteProduct } = useShopDeleteProduct()

const columns = [
  {
    key: 'title',
    label: 'Title',
  },
  {
    key: 'sku',
    label: 'SKU Variant',
  },
  {
    key: 'variant',
    label: 'Variant',
  },
  {
    key: 'price',
    label: 'Price',
  },
  {
    key: 'stock',
    label: 'Stock',
  },
  {
    key: 'actions',
  },
]

const rows = computed<ProductRow[]>(() => {
  if (!dataShopGetProducts.value) {
    return []
  }

  return dataShopGetProducts.value.items.map(product => ({
    id: product.id,
    slug: product.slug,
    title: product.title,
    state: product.state,
    imageUrl: product.images[0]?.url ?? '',
    variants: product.variants,
    inventory: product.inventory,
    variantType: product.variant_type ?? ProductVariantTypes.NONE,
    actions: { class: 'text-right' },
  }))
})

const totalProducts = computed(() => {
  const response = dataShopGetProducts.value as {
    items?: unknown[]
    meta?: {
      total?: number
      total_results?: number
      total_pages?: number
      limit?: number
    }
  } | undefined

  const total = response?.meta?.total ?? response?.meta?.total_results
  if (typeof total === 'number' && total > 0) {
    return total
  }

  if (
    typeof response?.meta?.total_pages === 'number'
    && response.meta.total_pages > 0
  ) {
    return response.meta.total_pages * (response.meta.limit ?? pageCount)
  }

  return response?.items?.length ?? 0
})
const paginationKey = computed(() => `${page.value}-${totalProducts.value}`)

function editProduct(row: ProductRow) {
  navigateTo(routes.accountShopProductDetail(row.id))
}

function previewProduct(row: ProductRow) {
  if (!dataMyShop.value?.slug) {
    return
  }

  navigateTo(routes.productDetail(dataMyShop.value.slug, row.slug), {
    open: { target: '_blank' },
  })
}

function shouldShowPreviewButton(row: ProductRow) {
  return row.state !== ProductStates.DRAFT
}

const itemsDropdownWithRow = (row: ElementType<typeof rows.value>): DropdownItem[][] => [
  [
    {
      label: 'Duplicate',
      icon: 'i-heroicons-document-duplicate-20-solid',
      disabled: true,
    },
  ],
  [
    {
      label: 'Archive',
      icon: 'i-heroicons-archive-box-20-solid',
      disabled: true,
    },
    {
      label: 'Edit',
      icon: 'i-heroicons-pencil-square-20-solid',
      click: () => editProduct(row),
    },
    ...(shouldShowPreviewButton(row)
      ? [{
          label: 'Preview',
          icon: 'i-heroicons-eye-20-solid',
          click: () => previewProduct(row),
        }]
      : []),
  ],
  [
    {
      label: 'Delete',
      icon: 'i-heroicons-trash-20-solid',
      click: () => removeProduct(row.id),
    },
  ],
]

async function removeProduct(id: string) {
  await deleteProduct(id)
  await refetch()
}
</script>

<template>
  <LayoutShopWrapperContent>
    <template #title>
      Products
    </template>
    <template #actions>
      <UButton
        :to="`${ROUTES.ACCOUNT}${ROUTES.SHOP}${ROUTES.PRODUCTS}${ROUTES.NEW}`"
        size="sm"
      >
        + Create product
      </UButton>
    </template>
    <template #content>
      <UTable
        v-model="selected"
        class=""
        :rows="rows"
        :empty-state="{ icon: 'i-heroicons-archive-box-20-solid', label: 'No products.' }"
        :columns="columns"
        :loading="isPendingShopGetProducts"
      >
        <template #title-data="{ row }">
          <div class="flex max-w-[200px] gap-2">
            <NuxtImg
              v-if="row.imageUrl"
              :src="row.imageUrl"
              width="50"
              height="50"
              class="rounded"
              preload
            />
            <div class="truncate">
              {{ row.title }}
            </div>
          </div>
        </template>

        <template #sku-data="{ row }">
          <div>
            <div
              v-for="(inv, idx) of row.inventory"
              :key="idx"
            >
              {{ inv?.sku || '-' }}
            </div>
          </div>
        </template>

        <template #variant-data="{ row }">
          <div v-if="row.variantType === ProductVariantTypes.NONE">
            None
          </div>
          <div v-else>
            <div
              v-for="(inv, index) of row.inventory"
              :key="index"
            >
              {{
                row.variants.find((variant: ProductVariantRow) => variant.id === inv.product_variant_id)?.name?.replaceAll('-', ', ')
                  || '-'
              }}
            </div>
          </div>
        </template>

        <template #price-data="{ row }">
          <div>
            <div
              v-for="(inv, idx) of row.inventory"
              :key="idx"
            >
              {{ formatCurrency(inv.price) }}
            </div>
          </div>
        </template>

        <template #stock-data="{ row }">
          <div>
            <div
              v-for="(inv, idx) of row.inventory"
              :key="idx"
            >
              {{ inv.stock }}
            </div>
          </div>
        </template>

        <template #actions-data="{ row }">
          <div class="flex w-full items-center justify-end gap-1">
            <div class="flex items-center">
              <UButton
                color="gray"
                variant="ghost"
                class="row-hover-action p-1.5 transition-opacity"
                @click="editProduct(row)"
              >
                <AppIcon
                  name="edit"
                  class="cursor-pointer"
                />
              </UButton>
              <UButton
                v-if="shouldShowPreviewButton(row)"
                color="gray"
                variant="ghost"
                class="row-hover-action p-1.5 transition-opacity"
                icon="i-heroicons-eye-20-solid"
                @click="previewProduct(row)"
              />
            </div>
            <UDropdown :items="itemsDropdownWithRow(row)">
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-ellipsis-horizontal-20-solid"
              />
            </UDropdown>
          </div>
        </template>

        <template #loading-state>
          <div class="grid h-[80vh] w-full place-content-center">
            <LoadingSvg :child-class="'!w-12 !h-12'" />
          </div>
        </template>
      </UTable>

      <FixedPagination
        :key="paginationKey"
        :page="page"
        :page-count="pageCount"
        :total="totalProducts"
        @on-change-page="(val) => page = val"
      />
    </template>
  </LayoutShopWrapperContent>
</template>

<style scoped>
:deep(tbody tr .row-hover-action) {
  opacity: 0;
}

:deep(tbody tr:hover .row-hover-action) {
  opacity: 1;
}
</style>
