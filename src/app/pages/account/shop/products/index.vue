<script lang="ts" setup>
import type { DropdownItem } from '#ui/types'
import LoadingSvg from '~/shared/ui/loading-svg.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import FixedPagination from '~/app/components/account/shop/fixed-pagination.vue'
import { ROUTES } from '~/shared/config/enums/routes'
import { ProductVariantTypes } from '~/shared/config/enums/product'
import type { Product } from '~/shared/types/product'
import type { ElementType } from '~/shared/types/utils'
import { useShopDeleteProduct, useShopGetProducts } from '~/shared/server-state/shop'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

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

const rows = computed(() => {
  if (dataShopGetProducts.value?.results && dataShopGetProducts.value.results.length > 0) {
    return dataShopGetProducts.value.results.map(product => ({
      id: product.id,
      title: product.title,
      image_url: `domainAwsS3/${product?.image_relative_url}`,
      inventories: product.inventories,
      variant_type: product.variant_type,
    }))
  }
  return []
})

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
      label: 'Preview',
      icon: 'i-heroicons-arrow-right-circle-20-solid',
      click: () => {
        navigateTo(`${ROUTES.PRODUCTS}/${row.id}`, {
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

async function removeProduct(id: Product['id']) {
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
      <!--    <div class="w-fit"> -->
      <!--      <UPopover> -->
      <!--    <UButton -->
      <!--      color="white" -->
      <!--      label="Status" -->
      <!--      trailing-icon="i-heroicons-chevron-down-20-solid" -->
      <!--    /> -->

      <!--        <template #panel> -->
      <!--          <div class="p-4"> -->
      <!--            <Placeholder class="h-20 w-48"/> -->
      <!--            <h3 class="font-semibold mb-3"> -->
      <!--              Filter by status -->
      <!--            </h3> -->
      <!--            <div v-for="status of productStates"> -->
      <!--              <UCheckbox -->
      <!--                  :id="status" -->
      <!--                  v-model="selectedCheckbox" -->
      <!--                  name="status" -->
      <!--                  :label="status" -->
      <!--                  :value="status" -->
      <!--                  class="mb-2" -->
      <!--              /> -->
      <!--            </div> -->
      <!--          </div> -->
      <!--        </template> -->
      <!--      </UPopover> -->
      <!--    </div> -->

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
              :src="row.image_url"
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
              v-for="(inv, idx) of row.inventories"
              :key="idx"
            >
              {{ inv?.sku || '-' }}
            </div>
          </div>
        </template>

        <template #variant-data="{ row }">
          <div v-if="row.variant_type === ProductVariantTypes.NONE">
            None
          </div>
          <div v-else>
            <div
              v-for="(inv, index) of row.inventories"
              :key="index"
            >
              {{
                row.variant_type === ProductVariantTypes.COMBINE
                  ? inv.variant.replaceAll('-', ', ')
                  : inv.variant
              }}
            </div>
          </div>
        </template>

        <template #price-data="{ row }">
          <div>
            <div
              v-for="(inv, idx) of row.inventories"
              :key="idx"
            >
              {{ formatCurrency(inv.price) }}
            </div>
          </div>
        </template>

        <template #stock-data="{ row }">
          <div>
            <div
              v-for="(inv, idx) of row.inventories"
              :key="idx"
            >
              {{ inv.stock }}
            </div>
          </div>
        </template>

        <template #actions-data="{ row }">
          <div class="flex items-center justify-center">
            <UTooltip text="Feature not available">
              <!-- :to="`${ROUTES.ACCOUNT}${ROUTES.SHOP}${ROUTES.PRODUCTS}/${row.id}`" -->
              <UButton
                color="gray"
                variant="ghost"
                class="p-1.5"
              >
                <Icon
                  name="i-material-symbols:ink-pen-rounded"
                  class=" cursor-pointer"
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
        :total="dataShopGetProducts?.total_results"
        @on-change-page="(val) => page = val"
      />
    </template>
  </LayoutShopWrapperContent>
</template>
