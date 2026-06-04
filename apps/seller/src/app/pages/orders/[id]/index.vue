<script lang="ts" setup>
import SellerOrderDetailContent from '../_components/order-detail-content.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import { routes } from '~/shared/navigation/routes'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

const route = useRoute()
const orderId = computed(() => String(route.params.id ?? ''))
</script>

<template>
  <LayoutShopWrapperContent>
    <template #title>
      Order details
    </template>
    <template #actions>
      <UButton
        :to="routes.orders()"
        color="gray"
        variant="ghost"
      >
        Back to orders
      </UButton>
    </template>
    <template #content>
      <SellerOrderDetailContent
        :key="orderId"
        :order-id="orderId"
      />
    </template>
  </LayoutShopWrapperContent>
</template>
