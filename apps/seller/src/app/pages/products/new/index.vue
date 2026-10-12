<script lang="ts" setup>
import { defineAsyncComponent } from 'vue'
import LoadingSvg from '@arc/ui/primitives/loading-svg.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import { routes } from '~/shared/navigation/routes'
import { useCategoryIdentityBlocked } from '~/domains/_shared/category-identity-guard'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

const { blocked, checking, checkForUpdate } = useCategoryIdentityBlocked()

const CreateProductForm = defineAsyncComponent({
  loader: () => import('./_components/create-product-form/create-product-form.vue'),
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
        <CategoryIdentityUpdateCard
          v-if="blocked"
          :checking="checking"
          @check="checkForUpdate"
        />
        <CreateProductForm v-else />
      </div>
    </template>
  </LayoutShopWrapperContent>
</template>
