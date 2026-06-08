<script lang="ts" setup>
import DetailInfoCard from './detail-info-card.vue'
import DetailInfoItem from './detail-info-item.vue'
import type { ShopOrder } from './types'

const props = defineProps<{
  order: ShopOrder
}>()

const shippingAddress = computed(() => props.order.shipping_address)

const streetAddressLines = computed(() => {
  const address = shippingAddress.value

  return [
    address.address1,
    address.address2,
    [address.city, address.state, address.zip].filter(Boolean).join(', '),
  ].filter(Boolean)
})

const country = computed(() => shippingAddress.value.country)
const phone = computed(() => shippingAddress.value.phone)
const fullName = computed(() => shippingAddress.value.full_name)
</script>

<template>
  <DetailInfoCard title="Shipping address">
    <div class="space-y-4 text-sm">
      <DetailInfoItem label="Name">
        <div class="font-medium">
          {{ fullName }}
        </div>
      </DetailInfoItem>
      <DetailInfoItem label="Address">
        <div class="space-y-1">
          <div
            v-for="line in streetAddressLines"
            :key="line"
          >
            {{ line }}
          </div>
        </div>
      </DetailInfoItem>
      <DetailInfoItem
        v-if="country"
        label="Country"
      >
        <div>{{ country }}</div>
      </DetailInfoItem>
      <DetailInfoItem
        v-if="phone"
        label="Phone"
      >
        <div>{{ phone }}</div>
      </DetailInfoItem>
    </div>
  </DetailInfoCard>
</template>
