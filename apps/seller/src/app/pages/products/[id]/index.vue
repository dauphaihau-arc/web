<script lang="ts" setup>
import { defineAsyncComponent } from 'vue'
import LoadingSvg from '@arc/ui/primitives/loading-svg.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import { routes } from '~/shared/navigation/routes'
import { useShopGetDetailProduct } from '~/shared/server-state/shop/product/detail.query'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

const UpdateProductForm = defineAsyncComponent({
  loader: () => import('./_components/update-product-form.vue'),
  loadingComponent: LoadingSvg,
})

const route = useRoute()
const productId = route.params.id as string

const {
  isPending,
} = useShopGetDetailProduct(productId, {
  onResponseError: () => {
    throw showError({
      statusCode: 404,
      statusMessage: 'Page Not Found',
      fatal: true,
    })
  },
})
</script>

<template>
  <LayoutShopWrapperContent
    back-label="Products"
    :back-to="routes.products()"
  >
    <template #title>
      Update product
    </template>
    <template #content>
      <div class="mb-20">
        <div
          v-if="isPending"
          class="grid h-[80vh] w-full place-content-center"
        >
          <LoadingSvg :child-class="'!w-12 !h-12'" />
        </div>
        <UpdateProductForm v-else />
      </div>
    </template>
  </LayoutShopWrapperContent>
</template>
