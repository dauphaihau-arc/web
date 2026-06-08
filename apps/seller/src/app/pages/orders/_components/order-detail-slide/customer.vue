<script lang="ts" setup>
import type { ShopOrder } from '~/app/pages/orders/[id]/_components/order-detail-content/types'

const props = defineProps<{
  shippingAddress: ShopOrder['shipping_address']
  customer: ShopOrder['customer']
}>()

const shippingAddressLines = computed(() => [
  props.shippingAddress.address1,
  props.shippingAddress.address2,
  [props.shippingAddress.city, props.shippingAddress.state, props.shippingAddress.zip].filter(Boolean).join(', '),
  props.shippingAddress.country,
].filter(Boolean))
</script>

<template>
  <div>
    <div class="font-semibold">
      Customer
    </div>

    <div class="mt-4 space-y-4 text-sm">
      <div class="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)] md:gap-6">
        <div class="text-text-muted">
          Full name:
        </div>
        <div class="text-text-strong">
          {{ customer.full_name }}
        </div>
      </div>

      <div class="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)] md:gap-6">
        <div class="text-text-muted">
          Email:
        </div>
        <div class="text-text-strong break-all">
          {{ customer.email }}
        </div>
      </div>

      <div
        v-if="shippingAddress.phone"
        class="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)] md:gap-6"
      >
        <div class="text-text-muted">
          Phone Number:
        </div>
        <div class="text-text-strong">
          {{ shippingAddress.phone }}
        </div>
      </div>

      <div class="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)] md:gap-6">
        <div class="text-text-muted">
          Shipping Address:
        </div>
        <div class="space-y-1 text-text-strong">
          <div
            v-for="line in shippingAddressLines"
            :key="line"
          >
            {{ line }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
