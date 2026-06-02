<script lang="ts" setup>
import LoadingSvg from '@arc/ui/loading-svg.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import UpdateProductForm from '~/app/components/account/shop/products/update-product-form/update-product-form.vue'
import { useShopGetDetailProduct } from '~/shared/server-state/shop/product/detail.query'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

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
  <LayoutShopWrapperContent>
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
