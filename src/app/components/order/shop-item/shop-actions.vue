<script setup lang="ts">
import { OrderShippingStatuses, OrderStatuses } from '~/shared/config/enums/order'
import OrderCancelRequestDialog from '~/app/components/dialogs/order-cancel-request-dialog.vue'
import OrderSupportRequestDialog from '~/app/components/dialogs/order-support-request-dialog.vue'
import type { GetOrderShopsResponse } from '~/shared/api/me/order/contracts/order.contract'
import type { ElementType } from '~/shared/contracts/utils'

const props = withDefaults(defineProps<{
  orderShop: ElementType<GetOrderShopsResponse['order_shops']>
  showViewOrderLink?: boolean
}>(), {
  showViewOrderLink: true,
})

const dialog = useModal()

const canCancelOrder = computed(() =>
  [OrderStatuses.PAID, OrderStatuses.PENDING].includes(props.orderShop.status)
  && props.orderShop.shipping.shipping_status === OrderShippingStatuses.PRE_TRANSIT,
)

function openCancelDialog() {
  dialog.open(OrderCancelRequestDialog, {
    orderId: props.orderShop.id,
  })
}

function openSupportDialog() {
  dialog.open(OrderSupportRequestDialog, {
    orderId: props.orderShop.id,
    initialNote: props.orderShop.customer_support_note,
  })
}
</script>

<template>
  <div>
    <div class="mt-4 flex flex-col gap-4">
      <!-- <UTooltip :text="canTrackPackage ? props.orderShop.shipping.tracking_number : 'Tracking number not available yet'">
        <UButton
          block
          size="md"
          :disabled="!canTrackPackage"
          @click="openTracking"
        >
          Track package
        </UButton>
      </UTooltip> -->
      <!-- <UButton
        v-if="props.showViewOrderLink"
        block
        size="md"
        color="gray"
        :to="routes.orderDetail(props.orderShop.id)"
      >
        View order
      </UButton> -->
      <UButton
        block
        size="md"
        color="gray"
        @click="openSupportDialog"
      >
        Help with order
      </UButton>
      <UButton
        block
        size="md"
        color="gray"
        :disabled="!canCancelOrder"
        @click="openCancelDialog"
      >
        Cancel order
      </UButton>
      <UTooltip text="Feature not available">
        <UButton
          block
          size="md"
          color="gray"
        >
          View receipt
        </UButton>
      </UTooltip>
    </div>
  </div>
</template>

<style scoped>

</style>
