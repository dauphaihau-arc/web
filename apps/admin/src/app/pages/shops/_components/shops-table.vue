<script setup lang="ts">
import type { AdminShopListEntry } from '~/domains/shops/api/contracts/admin-shops.contract'
import AppIcon from '@arc/ui/primitives/app-icon.vue'
import DataTable from '@arc/ui/primitives/data-table/data-table.vue'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import {
  formatShopCurrency,
  formatShopStatusLabel,
  shopStatusTone,
} from '~/domains/shops/utils/shop-presentation'
import FixedPagination from '@arc/ui/patterns/fixed-pagination.vue'
import { routes } from '~/shared/navigation/routes'

const props = defineProps<{
  shops: AdminShopListEntry[]
  page: number
  pageCount: number
  total: number
}>()

const emit = defineEmits<{
  'update:page': [value: number]
}>()

type ShopTableRow = {
  id: string
  shop: string
  products: number
  status: string
  currency: string
  owner: string
  raw: AdminShopListEntry
}

const rows = computed<ShopTableRow[]>(() =>
  props.shops.map(shop => ({
    id: shop.id,
    shop: shop.shop_name,
    products: shop.product_count,
    status: formatShopStatusLabel(shop.status),
    currency: formatShopCurrency(shop.currency),
    owner: shop.owner_name ?? shop.owner_email,
    raw: shop,
  })),
)

const columns = [
  { key: 'shop', label: 'Shop' },
  { key: 'products', label: 'Products', class: 'text-center' },
  { key: 'status', label: 'Status' },
  { key: 'currency', label: 'Currency' },
  { key: 'owner', label: 'Owner' },
]

function openShop(row: ShopTableRow) {
  return navigateTo(routes.shopDetail(row.id))
}
</script>

<template>
  <div>
    <DataTable
      :rows="rows"
      :columns="columns"
      :selectable="false"
      :empty-state="{ icon: 'archive', label: 'No shops found.' }"
      clickable-rows
      @row-click="row => openShop(row as ShopTableRow)"
    >
      <template #empty-state>
        <div class="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <AppIcon
            name="archive"
            size="lg"
            class="text-text-muted"
          />
          <p class="text-sm text-text-muted">
            No shops match the current search.
          </p>
        </div>
      </template>

      <template #shop-data="{ row }">
        <div class="text-sm font-medium text-text-strong">
          {{ row.shop }}
        </div>
      </template>

      <template #products-data="{ row }">
        <div class="text-center text-sm tabular-nums text-text-muted">
          {{ row.products }}
        </div>
      </template>

      <template #status-data="{ row }">
        <StatusBadge
          :color="shopStatusTone(row.raw.status)"
          class="capitalize"
        >
          {{ row.status }}
        </StatusBadge>
      </template>

      <template #currency-data="{ row }">
        <div class="text-sm text-text-muted">
          {{ row.currency }}
        </div>
      </template>

      <template #owner-data="{ row }">
        <div class="break-all text-sm text-text-muted">
          {{ row.owner }}
        </div>
      </template>
    </DataTable>

    <FixedPagination
      :page="page"
      :page-count="pageCount"
      :total="total"
      @on-change-page="emit('update:page', $event)"
    />
  </div>
</template>
