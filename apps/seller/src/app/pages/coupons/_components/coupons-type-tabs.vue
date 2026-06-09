<script lang="ts" setup>
import { couponTypeFilterOptions, type CouponTypeFilter } from './coupon-type-filter-options'
import type { ListShopCouponsResponse } from '~/shared/api/shop/coupon/contracts/coupon.contract'

type TypeCounts = ListShopCouponsResponse['type_counts']

const props = defineProps<{
  counts?: TypeCounts
}>()

const model = defineModel<CouponTypeFilter | undefined>()

const tabsKey = computed(() => JSON.stringify(props.counts ?? {}))

const tabs = computed(() => [
  {
    label: `All (${props.counts?.all ?? 0})`,
    value: undefined,
  },
  ...couponTypeFilterOptions.map(option => ({
    label: `${option.label} (${props.counts?.[option.value] ?? 0})`,
    value: option.value,
  })),
])

const activeTabIndex = computed(() =>
  tabs.value.findIndex(tab => tab.value === model.value),
)

function handleChange(index: number) {
  model.value = tabs.value[index]?.value
}
</script>

<template>
  <div class="mb-4 overflow-x-auto">
    <UTabs
      :key="tabsKey"
      :items="tabs"
      :model-value="activeTabIndex"
      class="min-w-max"
      @change="handleChange"
    />
  </div>
</template>
