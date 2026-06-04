<script lang="ts" setup>
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { CouponAppliesTo, CouponTypes } from '@arc/enums/coupon'
import { CreateCouponPageTypes } from '@arc/enums/shop'
import LoadingSvg from '@arc/ui/loading-svg.vue'
import type { DropdownItem } from '#ui/types'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import FixedPagination from '~/app/components/fixed-pagination.vue'
import { ROUTES } from '~/shared/config/enums/routes'
import DataTable from '~/shared/ui/data-table/data-table.vue'
import { useShopBulkDeleteCoupons } from '~/shared/server-state/shop/coupon/bulk-delete-coupons.mutation'
import { useShopDeleteCoupon } from '~/shared/server-state/shop/coupon/delete-coupon.mutation'
import { useShopGetCoupons } from '~/shared/server-state/shop/coupon/coupons.query'
import type { ListShopCouponsResponse } from '~/shared/api/shop/coupon/contracts/coupon.contract'

dayjs.extend(localizedFormat)

definePageMeta({ layout: 'shop', middleware: ['auth'] })

type CouponRow = Omit<ListShopCouponsResponse['results'][number], 'start_date' | 'end_date'> & {
  start_date: string
  end_date: string
  actions: { class: string }
}

const selected = ref<CouponRow[]>([])
const pageCount = 10
const page = ref(1)

const params = computed(() => ({
  page: page.value,
}))

const {
  isPending: isPendingShopGetCoupons,
  data: dataShopGetCoupons,
  refetch: refetchShopGetCoupons,
} = useShopGetCoupons(params)

const { mutateAsync: deleteCoupon } = useShopDeleteCoupon()
const {
  mutateAsync: bulkDeleteCoupons,
  isPending: isBulkDeletingCoupons,
} = useShopBulkDeleteCoupons()

const columns = [
  {
    key: 'code',
    label: 'Code',
  },
  {
    key: 'applies-to',
    label: 'Products apply',
    class: 'text-center',
  },
  {
    key: 'discount',
    label: 'Discount',
    class: 'text-center',
  },
  {
    key: 'max_uses',
    label: 'Max total uses',
    class: 'text-center',
  },
  {
    key: 'status',
    label: 'Start - end date',
    class: 'text-center',
  },
  {
    key: 'actions',
  },
]

const rows = computed<CouponRow[]>(() => {
  if (dataShopGetCoupons.value?.results && dataShopGetCoupons.value.results.length > 0) {
    return dataShopGetCoupons.value.results.map((coupon: ListShopCouponsResponse['results'][number]) => ({
      ...coupon,
      start_date: dayjs(coupon.start_date).format('HH:mm L'),
      end_date: dayjs(coupon.end_date).format('HH:mm L'),
      actions: { class: 'text-right' },
    }))
  }
  return []
})

const selectedIds = computed(() => selected.value.map(row => row.id))
const selectedCount = computed(() => selectedIds.value.length)
const hasSelectedCoupons = computed(() => selectedCount.value > 0)

watch(params, () => {
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
}

const itemsDropdownWithRow = (row: { id: string }): DropdownItem[][] => [
  [
    {
      label: 'Edit',
      icon: 'i-heroicons-pencil-square-20-solid',
      disabled: true,
      click: () => row,
      // click: () => console.log('Edit', row.id),
    },
  ],
  [
    {
      label: 'Delete',
      icon: 'i-heroicons-trash-20-solid',
      click: async () => {
        await deleteCoupon(row.id)
        selected.value = selected.value.filter(item => item.id !== row.id)
        await refetchShopGetCoupons()
      },
    },
  ],
]
</script>

<template>
  <LayoutShopWrapperContent>
    <template #title>
      Coupons
    </template>
    <template #actions>
      <div class="space-x-3">
        <UButton
          :to="`${ROUTES.ACCOUNT}${ROUTES.SHOP}${ROUTES.COUPONS}${ROUTES.NEW}?type=${CreateCouponPageTypes.PROMO_CODE}`"
          size="sm"
        >
          + Create a promo code
        </UButton>
        <UButton
          :to="`${ROUTES.ACCOUNT}${ROUTES.SHOP}${ROUTES.COUPONS}${ROUTES.NEW}?type=${CreateCouponPageTypes.SALE}`"
          size="sm"
        >
          + Run sale
        </UButton>
      </div>
    </template>

    <template #content>
      <UCard
        v-if="hasSelectedCoupons"
        class="sticky top-4 z-[3] mb-4"
      >
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div class="text-sm text-zinc-600">
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
        :loading="isPendingShopGetCoupons"
      >
        <template #code-data="{ row }">
          <div>
            <div class="text-xs">
              {{ row.is_auto_sale ? 'Sale' : 'Promo code' }}
            </div>
            <div class="text-xs">
              {{ row.code }}
            </div>
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
          <div class="text-center">
            {{ row.start_date }} - {{ row.end_date }}
          </div>
        </template>

        <template #actions-data="{ row }">
          <div class="flex items-center justify-end">
            <!-- <UTooltip text="Feature not available">
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
            </UTooltip> -->
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
        :total="dataShopGetCoupons?.total_results"
        @on-change-page="(val) => page = val"
      />
    </template>
  </LayoutShopWrapperContent>
</template>
