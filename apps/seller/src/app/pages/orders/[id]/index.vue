<script lang="ts" setup>
import SellerOrderDetailContent from '../_components/order-detail-content.vue'
import OrderDetailActions from './_components/order-detail-actions.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import { routes } from '~/shared/navigation/routes'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

const route = useRoute()
const orderId = computed(() => String(route.params.id ?? ''))
</script>

<template>
  <LayoutShopWrapperContent
    back-label="Back to orders"
    :back-to="routes.orders()"
  >
    <template #title>
      Order details
    </template>
    <template #actions>
      <OrderDetailActions :order-id="orderId" />
    </template>
    <template #content>
      <SellerOrderDetailContent
        :key="orderId"
        :order-id="orderId"
      />
    </template>
  </LayoutShopWrapperContent>
</template>
