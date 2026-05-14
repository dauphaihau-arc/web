<script lang="ts" setup>
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
