<script lang="ts" setup>
import LoadingSvg from '@arc/ui/loading-svg.vue'
import UpdateProductForm from '../_components/update-product-form/update-product-form.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
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
