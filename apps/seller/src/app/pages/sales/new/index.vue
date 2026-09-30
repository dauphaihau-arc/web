<script lang="ts" setup>
import CreateSaleForm from './_components/create-sale-form.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import { routes } from '~/shared/navigation/routes'

definePageMeta({ layout: 'shop', middleware: ['auth'] })
</script>

<template>
  <LayoutShopWrapperContent
    back-label="Sales"
    :back-to="routes.sales()"
    content-class="pb-24"
  >
    <template #title>
      Run a sale
    </template>
    <template #description>
      A sale automatically reduces the current regular price of the products you choose during a
      schedule you set. It has no code and no checkout conditions.
    </template>
    <template #content>
      <CreateSaleForm />
    </template>
  </LayoutShopWrapperContent>
</template>
