<script lang="ts" setup>
import { useShopGetDetailProduct } from '~/shared/services/shop'
import type { Product } from '~/shared/types/product'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

const route = useRoute()

const {
  isPending,
} = useShopGetDetailProduct(route.params.id as Product['id'], {
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
