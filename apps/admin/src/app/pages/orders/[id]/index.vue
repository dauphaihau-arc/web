<script setup lang="ts">
import OrderDetailPageContent from './_components/order-detail-page-content.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const route = useRoute()
const orderId = computed(() => String(route.params.id ?? ''))
</script>

<template>
  <OrderDetailPageContent :order-id="orderId" />
</template>
