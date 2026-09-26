<script lang="ts" setup>
import {
  buildShippingProfileListViewTabs,
  SHIPPING_PROFILE_LIST_VIEWS,
  type ShippingProfileListView,
} from './shipping-profile-list-views'
import type { ShippingProfileListResponse } from '~/domains/shop/api/shipping-profile/contracts/shipping-profile.contract'

const props = defineProps<{
  counts?: ShippingProfileListResponse['status_counts']
}>()

const model = defineModel<ShippingProfileListView>({ default: SHIPPING_PROFILE_LIST_VIEWS.ALL })

const tabsKey = computed(() => JSON.stringify(props.counts ?? {}))

const tabs = computed(() => buildShippingProfileListViewTabs(props.counts))

const activeTabIndex = computed(() =>
  tabs.value.findIndex(tab => tab.value === model.value),
)

function handleChange(index: number) {
  const next = tabs.value[index]?.value

  if (next) {
    model.value = next
  }
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
