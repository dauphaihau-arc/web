<script lang="ts" setup>
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import type { DropdownItem } from '#ui/types'
import LoadingSvg from '~/shared/ui/primitives/loading-svg.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import FixedPagination from '~/modules/pages/account/shop/fixed-pagination.vue'
import { ROUTES } from '~/shared/config/enums/routes'
import { CouponAppliesTo, CouponTypes } from '~/shared/config/enums/coupon'
import { useShopDeleteCoupon, useShopGetCoupons } from '~/shared/server-state/shop'
import { CreateCouponPageTypes } from '~/shared/config/enums/shop'

dayjs.extend(localizedFormat)

definePageMeta({ layout: 'shop', middleware: ['auth'] })

const selected = ref([])
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

const rows = computed(() => {
  if (dataShopGetCoupons.value?.results && dataShopGetCoupons.value.results.length > 0) {
    return dataShopGetCoupons.value.results.map(coupon => ({
      ...coupon,
      start_date: dayjs(coupon.start_date).format('HH:mm L'),
      end_date: dayjs(coupon.end_date).format('HH:mm L'),
      actions: { class: 'text-right' },
    }))
  }
  return []
})

const itemsDropdownWithRow = (row: { id: string }): DropdownItem[][] => [
  [
    {
      label: 'Edit',
      icon: 'i-heroicons-pencil-square-20-solid',
      disabled: true,
      click: () => row,
      // click: () => console.log('Edit', row.id),
    },
    {
      label: 'Duplicate',
      disabled: true,
      icon: 'i-heroicons-document-duplicate-20-solid',
    },
  ],
  [
    {
      label: 'Archive',
      disabled: true,
      icon: 'i-heroicons-archive-box-20-solid',
    },
    {
      label: 'Preview',
      icon: 'i-heroicons-arrow-right-circle-20-solid',
      disabled: true,
    },
  ],
  [
    {
      label: 'Delete',
      icon: 'i-heroicons-trash-20-solid',
      click: async () => {
        await deleteCoupon(row.id)
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
      <UTable
        v-model="selected"
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
            <UTooltip text="Feature not available">
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
        :total="dataShopGetCoupons?.total_results"
        @on-change-page="(val) => page = val"
      />
    </template>
  </LayoutShopWrapperContent>
</template>
