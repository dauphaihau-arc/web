<script lang="ts" setup>
import { defineAsyncComponent } from 'vue'
import { getStatusCode } from '@arc/lib'
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import LoadingSvg from '@arc/ui/primitives/loading-svg.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import { routes } from '~/shared/navigation/routes'
import { useShopGetDetailProduct } from '~/domains/shop/queries/product/detail.query'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

const UpdateProductForm = defineAsyncComponent({
  loader: () => import('./_components/update-product-form/update-product-form.vue'),
  loadingComponent: LoadingSvg,
})

const route = useRoute()
const productId = route.params.id as string

const { isPending, isError, error } = useShopGetDetailProduct(productId)

const isNotFound = computed(() => isError.value && getStatusCode(error.value) === 404)

const errorState = computed(() => isNotFound.value
  ? {
      icon: ICON_NAME_BY_ALIAS['product'],
      title: 'Product not found',
      description: 'This product may have been deleted, or the link is no longer valid.',
    }
  : {
      icon: ICON_NAME_BY_ALIAS['warning'],
      title: 'Could not load product',
      description: 'Something went wrong while loading this product. Please try again.',
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
        <Empty
          v-if="isPending"
          loading
          size="xl"
          variant="naked"
          description="Loading product..."
          container-class="min-h-[80vh]"
        />
        <Empty
          v-else-if="isError"
          v-bind="errorState"
          size="xl"
          variant="naked"
          container-class="min-h-[80vh]"
          :actions="[
            { label: 'Back to products', to: routes.products() },
          ]"
        />
        <UpdateProductForm v-else />
      </div>
    </template>
  </LayoutShopWrapperContent>
</template>
