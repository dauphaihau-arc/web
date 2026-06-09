<script lang="ts" setup>
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { CouponAppliesTo, CouponTypes } from '@arc/enums/coupon'
import LoadingSvg from '@arc/ui/loading-svg.vue'
import type { DropdownItem } from '#ui/types'
import type { ListShopCouponsResponse } from '~/shared/api/shop/coupon/contracts/coupon.contract'
import DataTable from '~/shared/ui/data-table/data-table.vue'
import FixedPagination from '~/app/components/fixed-pagination.vue'
import { useShopBulkDeleteCoupons } from '~/shared/server-state/shop/coupon/bulk-delete-coupons.mutation'
import { useShopDeleteCoupon } from '~/shared/server-state/shop/coupon/delete-coupon.mutation'

dayjs.extend(localizedFormat)

type CouponRow = Omit<ListShopCouponsResponse['results'][number], 'start_date' | 'end_date'> & {
  start_date: string
  end_date: string
  actions: { class: string }
}

const props = defineProps<{
  coupons: ListShopCouponsResponse['results']
  loading: boolean
  page: number
  pageCount: number
  total: number
}>()

const emit = defineEmits<{
  'update:page': [value: number]
  'refresh': []
}>()

const { coupons, loading, page, pageCount, total } = toRefs(props)

const selected = ref<CouponRow[]>([])

const { mutateAsync: deleteCoupon } = useShopDeleteCoupon()
const {
  mutateAsync: bulkDeleteCoupons,
  isPending: isBulkDeletingCoupons,
} = useShopBulkDeleteCoupons()

const columns = [
  { key: 'code', label: 'Code' },
  { key: 'coupon-type', label: 'Type', class: 'text-center' },
  { key: 'applies-to', label: 'Products Apply', class: 'text-center' },
  { key: 'discount', label: 'Discount', class: 'text-center' },
  { key: 'max_uses', label: 'Max Total Uses', class: 'text-center' },
  { key: 'status', label: 'Active period' },
  { key: 'actions' },
]

const rows = computed<CouponRow[]>(() => {
  return coupons.value.map(coupon => ({
    ...coupon,
    start_date: dayjs(coupon.start_date).format('MMM D, HH:mm'),
    end_date: dayjs(coupon.end_date).format('MMM D, HH:mm'),
    actions: { class: 'text-right' },
  }))
})

const selectedIds = computed(() => selected.value.map(row => row.id))
const selectedCount = computed(() => selectedIds.value.length)
const hasSelectedCoupons = computed(() => selectedCount.value > 0)

watch(coupons, () => {
  selected.value = []
})

async function runBulkDelete(
  ids = selectedIds.value,
  sourceRows = selected.value.filter(row => ids.includes(row.id)),
) {
  if (!ids.length) {
    return
  }

  const result = await bulkDeleteCoupons({ ids })
  const failedIds = new Set(result.failed.map(item => item.id))
  selected.value = sourceRows.filter(row => failedIds.has(row.id))
  emit('refresh')
}

const itemsDropdownWithRow = (row: { id: string }): DropdownItem[][] => [
  [
    {
      label: 'Edit',
      icon: 'i-heroicons-pencil-square-20-solid',
      disabled: true,
      click: () => row,
    },
  ],
  [
    {
      label: 'Delete',
      icon: 'i-heroicons-trash-20-solid',
      click: async () => {
        await deleteCoupon(row.id)
        selected.value = selected.value.filter(item => item.id !== row.id)
        emit('refresh')
      },
    },
  ],
]
</script>

<template>
  <div>
    <UCard
      v-if="hasSelectedCoupons"
      class="sticky top-4 z-[3] mb-4"
    >
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="text-sm text-text-subtle">
          {{ selectedCount }} coupon<span v-if="selectedCount > 1">s</span> selected
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <UButton
            color="red"
            variant="soft"
            :loading="isBulkDeletingCoupons"
            @click="runBulkDelete()"
          >
            Delete selected
          </UButton>
          <UButton
            color="gray"
            variant="ghost"
            :disabled="isBulkDeletingCoupons"
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
      :empty-state="{ icon: 'i-heroicons-archive-box-20-solid', label: 'No coupons.' }"
      :rows="rows"
      :columns="columns"
      :loading="loading"
    >
      <template #code-data="{ row }">
        <div class="text-sm">
          {{ row.code }}
        </div>
      </template>

      <template #coupon-type-data="{ row }">
        <div class="text-center text-sm">
          {{ row.is_auto_sale ? 'Sale' : 'Promo code' }}
        </div>
      </template>

      <template #applies-to-data="{ row }">
        <div class="text-center">
          {{ row.applies_to === CouponAppliesTo.ALL ? 'All' : `${row.applies_product_ids.length}` }} products
        </div>
      </template>

      <template #discount-data="{ row }">
        <div
          v-if="row.type === CouponTypes.FREE_SHIP"
          class="text-center"
        >
          Freeship
        </div>
        <div
          v-if="row.type === CouponTypes.PERCENTAGE"
          class="text-center"
        >
          {{ row.percent_off }}%
        </div>
        <div
          v-if="row.type === CouponTypes.FIXED_AMOUNT"
          class="text-center"
        >
          {{ formatCurrency(row.amount_off) }}
        </div>
      </template>

      <template #max_uses-data="{ row }">
        <div class="text-center">
          {{ row.max_uses }}
        </div>
      </template>

      <template #status-data="{ row }">
        <div>
          {{ row.start_date }} - {{ row.end_date }}
        </div>
      </template>

      <template #actions-data="{ row }">
        <div class="flex items-center justify-end">
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
      :page="page"
      :page-count="pageCount"
      :total="total"
      @on-change-page="emit('update:page', $event)"
    />
  </div>
</template>
