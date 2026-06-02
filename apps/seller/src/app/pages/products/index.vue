<script lang="ts" setup>
import { ProductStates, ProductVariantTypes } from '@arc/enums/product'
import { formatMinorCurrency } from '@arc/utils'
import type { ElementType } from '@arc/contracts/utils'
import LoadingSvg from '@arc/ui/loading-svg.vue'
import type { DropdownItem } from '#ui/types'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import FixedPagination from '~/app/components/account/shop/fixed-pagination.vue'
import { ROUTES } from '~/shared/config/enums/routes'
import { routes } from '~/shared/navigation/routes'
import DataTable from '~/shared/ui/data-table/data-table.vue'
import type {
  BulkMutateShopProductsAction,
  BulkMutateShopProductsResponse,
  ListShopProductsItem,
} from '~/shared/api/shop/product/contracts/read.contract'
import { useShopBulkMutateProducts } from '~/shared/server-state/shop/product/bulk-mutate-products.mutation'
import { useShopGetProducts } from '~/shared/server-state/shop/product/list.query'
import { useGetMyShop } from '~/shared/server-state/shop/my-shop.query'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

type ProductRow = {
  id: string
  slug: string
  title: string
  state?: ProductStates
  imageStorageKey: string
  variants: ListShopProductsItem['variants']
  inventory: ListShopProductsItem['inventory']
  variantType: ProductVariantTypes
}

type ProductVariantRow = ProductRow['variants'][number]
type PublishFailureSummary = {
  id: string
  title: string
  reason: string
}
type PublishFeedback = {
  title: string
  description: string
  reasonSummaries: string[]
  failedProducts: PublishFailureSummary[]
}

const selected = ref<ProductRow[]>([])
const publishFeedback = ref<PublishFeedback | null>(null)
const pageCount = 20
const page = ref(1)

const params = computed(() => ({
  page: page.value,
  limit: pageCount,
}))

const {
  isPending: isPendingShopGetProducts,
  data: dataShopGetProducts,
} = useShopGetProducts(params)

const config = useRuntimeConfig()
const assetHost = computed(() => config.public.assetHost?.replace(/\/+$/, '') ?? '')
const storefrontAppURL = computed(() =>
  config.public.storefrontAppURL.replace(/\/+$/, ''))

const { data: dataMyShop } = useGetMyShop()

const {
  mutateAsync: bulkMutateProducts,
  isPending: isBulkMutatingProducts,
} = useShopBulkMutateProducts()

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
    imageStorageKey: product.images[0]?.storage_key ?? '',
    variants: product.variants,
    inventory: product.inventory,
    variantType: product.variant_type ?? ProductVariantTypes.NONE,
    actions: { class: 'text-right' },
  }))
})

function buildAssetUrl(storageKey?: string) {
  if (!storageKey || !assetHost.value) {
    return ''
  }

  return `${assetHost.value}/${storageKey.replace(/^\/+/, '')}`
}

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
const selectedIds = computed(() => selected.value.map(row => row.id))
const selectedCount = computed(() => selectedIds.value.length)
const hasSelectedProducts = computed(() => selectedCount.value > 0)

watch(params, () => {
  selected.value = []
  publishFeedback.value = null
})

function editProduct(row: ProductRow) {
  navigateTo(routes.productDetail(row.id))
}

function previewProduct(row: ProductRow) {
  if (!dataMyShop.value?.slug) {
    return
  }

  navigateTo(
    `${storefrontAppURL.value}/${dataMyShop.value.slug}/${row.slug}`,
    {
      external: true,
      open: { target: '_blank' },
    },
  )
}

function shouldShowPreviewButton(row: ProductRow) {
  return row.state === ProductStates.ACTIVE
}

function buildPublishFeedback(
  result: BulkMutateShopProductsResponse,
  sourceRows: ProductRow[],
) {
  const rowById = new Map(sourceRows.map(row => [row.id, row]))
  const failedProducts = result.failed.map(item => ({
    id: item.id,
    title: rowById.get(item.id)?.title ?? item.id,
    reason: item.reason,
  }))

  const reasons = failedProducts.reduce((map, item) => {
    map.set(item.reason, (map.get(item.reason) ?? 0) + 1)
    return map
  }, new Map<string, number>())

  return {
    title: result.succeeded_ids.length > 0
      ? 'Some products need fixes before publishing'
      : 'Products need fixes before publishing',
    description: result.succeeded_ids.length > 0
      ? `${result.succeeded_ids.length} published, ${result.failed.length} need attention.`
      : `${result.failed.length} product${result.failed.length > 1 ? 's' : ''} couldn’t be published.`,
    reasonSummaries: Array.from(reasons.entries()).map(([reason, count]) =>
      `${count} product${count > 1 ? 's' : ''}: ${reason}`),
    failedProducts,
  }
}

async function runBulkMutation(
  action: BulkMutateShopProductsAction,
  ids = selectedIds.value,
  sourceRows = selected.value.filter(row => ids.includes(row.id)),
) {
  if (!ids.length) {
    return
  }

  publishFeedback.value = null

  const result = await bulkMutateProducts({
    ids,
    action,
  })

  const failedIds = new Set(result.failed.map(item => item.id))
  selected.value = sourceRows.filter(row => failedIds.has(row.id))

  if (action === 'publish' && result.failed.length > 0) {
    publishFeedback.value = buildPublishFeedback(result, sourceRows)
  }
}

function editFirstFailedProduct() {
  if (!publishFeedback.value?.failedProducts[0]?.id) {
    return
  }

  navigateTo(routes.productDetail(publishFeedback.value.failedProducts[0].id))
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
      label: 'Deactivate',
      icon: 'i-heroicons-archive-box-20-solid',
      disabled: row.state !== ProductStates.ACTIVE,
      click: () => runBulkMutation('deactivate', [row.id]),
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
      click: () => runBulkMutation('remove', [row.id]),
    },
  ],
]
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
      <div
        v-if="publishFeedback"
        class="mb-4 space-y-3"
      >
        <UAlert
          color="amber"
          variant="soft"
          :close-button="{
            icon: 'i-heroicons-x-mark-20-solid', color: 'gray', variant: 'link', padded: false,
          }"
          :title="publishFeedback.title"
          :description="publishFeedback.description"
          @close="publishFeedback = null"
        />

        <div class="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <div class="space-y-2 text-sm text-amber-950">
            <p
              v-for="reasonSummary in publishFeedback.reasonSummaries"
              :key="reasonSummary"
            >
              {{ reasonSummary }}
            </p>
          </div>

          <div class="mt-3 text-sm text-amber-900">
            <span class="font-medium">Affected products:</span>
            {{ publishFeedback.failedProducts.map(product => product.title).join(', ') }}
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <UButton
              color="amber"
              variant="soft"
              @click="editFirstFailedProduct"
            >
              Edit first failed product
            </UButton>
            <UButton
              color="gray"
              variant="ghost"
              @click="publishFeedback = null"
            >
              Dismiss
            </UButton>
          </div>
        </div>
      </div>

      <UCard
        v-if="hasSelectedProducts"
        class="sticky top-4 z-[3] mb-4"
      >
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div class="text-sm text-zinc-600">
            {{ selectedCount }} product<span v-if="selectedCount > 1">s</span> selected
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <UButton
              color="gray"
              variant="soft"
              :loading="isBulkMutatingProducts"
              @click="runBulkMutation('publish')"
            >
              Publish selected
            </UButton>
            <UButton
              color="gray"
              variant="soft"
              :loading="isBulkMutatingProducts"
              @click="runBulkMutation('deactivate')"
            >
              Deactivate selected
            </UButton>
            <UButton
              color="red"
              variant="soft"
              :loading="isBulkMutatingProducts"
              @click="runBulkMutation('remove')"
            >
              Delete selected
            </UButton>
            <UButton
              color="gray"
              variant="ghost"
              :disabled="isBulkMutatingProducts"
              @click="selected = []"
            >
              Clear
            </UButton>
          </div>
        </div>
      </UCard>

      <DataTable
        v-model="selected"
        by="id"
        :rows="rows"
        :empty-state="{ icon: 'i-heroicons-archive-box-20-solid', label: 'No products.' }"
        :columns="columns"
        :loading="isPendingShopGetProducts"
        clickable-rows
        @row-click="row => editProduct(row as ProductRow)"
      >
        <template #title-data="{ row }">
          <div class="flex max-w-[200px] gap-2">
            <NuxtImg
              v-if="row.imageStorageKey"
              :src="buildAssetUrl(row.imageStorageKey)"
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
              {{ formatMinorCurrency(inv.amount_minor, inv.currency) }}
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
                data-row-hover-action
                class="p-1.5 transition-opacity"
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
                data-row-hover-action
                class="p-1.5 transition-opacity"
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
      </DataTable>

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
