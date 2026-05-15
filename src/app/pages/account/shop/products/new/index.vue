<script lang="ts" setup>
import LayoutShopWrapperContent from '~/modules/layouts/shop/layout-shop-wrapper-content.vue'
import CreateProductForm from '~/modules/pages/account/shop/products/create-product-form.vue'

definePageMeta({ layout: 'shop', middleware: ['auth'] })
</script>

<template>
  <LayoutShopWrapperContent>
    <template #title>
      Create a product
    </template>
    <template #content>
      <div class="mb-20">
        <CreateProductForm />
      </div>
    </template>
  </LayoutShopWrapperContent>
</template>
