<script lang="ts" setup>
import AppTabs from '@arc/ui/patterns/app-tabs/app-tabs.vue'
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

const tabs = computed(() => buildShippingProfileListViewTabs(props.counts))

function handleChange(value: string | number) {
  const next = tabs.value.find(tab => tab.value === value)

  if (next) {
    model.value = next.value
  }
}
</script>

<template>
  <div class="mb-4 overflow-x-auto">
    <AppTabs
      aria-label="Shipping profile state"
      :items="tabs"
      :model-value="model"
      @change="handleChange"
    />
  </div>
</template>
