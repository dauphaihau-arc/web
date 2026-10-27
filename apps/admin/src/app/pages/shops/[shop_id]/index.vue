<script setup lang="ts">
import ShopDetailPageContent from './_components/shop-detail-page-content.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const route = useRoute()
const shopId = computed(() => String(route.params.shop_id ?? ''))
</script>

<template>
  <ShopDetailPageContent :shop-id="shopId" />
</template>
