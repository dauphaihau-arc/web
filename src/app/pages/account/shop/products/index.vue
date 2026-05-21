<script lang="ts" setup>
import type { DropdownItem } from '#ui/types'
import LoadingSvg from '~/shared/ui/loading-svg.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import FixedPagination from '~/app/components/account/shop/fixed-pagination.vue'
import { ROUTES } from '~/shared/config/enums/routes'
import { ProductVariantTypes } from '~/shared/config/enums/product'
import { routes } from '~/shared/navigation/routes'
import type { ListShopProductsItem } from '~/shared/api/shop/product/contracts/read.contract'
import type { ElementType } from '~/shared/contracts/utils'
import { useShopDeleteProduct } from '~/shared/server-state/shop/product/delete-product.mutation'
import { useShopGetProducts } from '~/shared/server-state/shop/product/list.query'
import { useGetMyShop } from '~/shared/server-state/shop/my-shop.query'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

type ProductRow = {
  id: string
  slug: string
  title: string
  imageUrl: string
  variants: ListShopProductsItem['variants']
  inventory: ListShopProductsItem['inventory']
  variantType: ProductVariantTypes
}

type ProductVariantRow = ProductRow['variants'][number]

const selected = ref([])
const pageCount = 10
const page = ref(1)

const params = computed(() => ({
  page: page.value,
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
    class: 'text-center',
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
    imageUrl: product.images[0]?.url ?? '',
    variants: product.variants,
    inventory: product.inventory,
    variantType: product.variantType ?? ProductVariantTypes.NONE,
  }))
})

const totalProducts = computed(() => dataShopGetProducts.value?.meta.total ?? 0)

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
      click: () => navigateTo(routes.accountShopProductDetail(row.id)),
    },
    {
      label: 'Preview',
      icon: 'i-heroicons-arrow-right-circle-20-solid',
      click: () => {
        if (!dataMyShop.value?.slug) {
          return
        }

        navigateTo(routes.productDetail(dataMyShop.value.slug, row.slug), {
          open: { target: '_blank' },
        })
      },
    },
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
        class="mb-20"
        :rows="rows"
        :empty-state="{ icon: 'i-heroicons-archive-box-20-solid', label: 'No products.' }"
        :columns="columns"
        :loading="isPendingShopGetProducts"
      >
        <template #title-data="{ row }">
          <div class="flex max-w-[200px] gap-2">
            <NuxtImg
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
                row.variants.find((variant: ProductVariantRow) => variant.id === inv.productVariantId)?.name?.replaceAll('-', ', ')
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
          <div class="flex items-center justify-center">
            <UTooltip text="Feature not available">
              <UButton
                color="gray"
                variant="ghost"
                class="p-1.5"
              >
                <AppIcon
                  name="edit"
                  class="cursor-pointer"
                />
              </UButton>
            </UTooltip>
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
        :page="page"
        :page-count="pageCount"
        :total="totalProducts"
        @on-change-page="(val) => page = val"
      />
    </template>
  </LayoutShopWrapperContent>
</template>
