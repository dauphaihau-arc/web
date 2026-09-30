<script lang="ts" setup>
import SalesTable from './_components/sales-table.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import { routes } from '~/shared/navigation/routes'

definePageMeta({ layout: 'shop', middleware: ['auth'] })
</script>

<template>
  <LayoutShopWrapperContent>
    <template #title>
      Sales
    </template>
    <template #actions>
      <UButton
        :to="routes.salesNew()"
        size="sm"
      >
        + Run a sale
      </UButton>
    </template>

    <template #content>
      <SalesTable />
    </template>
  </LayoutShopWrapperContent>
</template>
