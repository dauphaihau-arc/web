<script setup lang="ts">
import OrdersPageContent from './_components/orders-page-content.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})
</script>

<template>
  <OrdersPageContent />
</template>
