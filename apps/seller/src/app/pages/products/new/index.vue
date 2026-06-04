<script lang="ts" setup>
import CreateProductForm from '../_components/create-product-form/create-product-form.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'

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
