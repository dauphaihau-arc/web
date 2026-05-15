<script lang="ts" setup>
import LayoutShopWrapperContent from '~/modules/layouts/shop/layout-shop-wrapper-content.vue'

definePageMeta({ layout: 'shop', middleware: ['auth'] })
</script>

<template>
  <LayoutShopWrapperContent>
    <template #title>
      Dashboard
    </template>
  </LayoutShopWrapperContent>
</template>
