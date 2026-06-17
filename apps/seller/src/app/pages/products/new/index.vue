<script lang="ts" setup>
import { defineAsyncComponent } from 'vue'
import LoadingSvg from '@arc/ui/primitives/loading-svg.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import { routes } from '~/shared/navigation/routes'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

const CreateProductForm = defineAsyncComponent({
  loader: () => import('./_components/create-product-form.vue'),
  loadingComponent: LoadingSvg,
})
</script>

<template>
  <LayoutShopWrapperContent
    back-label="Products"
    :back-to="routes.products()"
  >
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
