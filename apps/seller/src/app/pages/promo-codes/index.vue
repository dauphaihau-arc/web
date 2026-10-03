<script lang="ts" setup>
import PromoCodesTable from './_components/promo-codes-table/promo-codes-table.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import { routes } from '~/shared/navigation/routes'

definePageMeta({ layout: 'shop', middleware: ['auth'] })
</script>

<template>
  <LayoutShopWrapperContent>
    <template #title>
      Promo codes
    </template>
    <template #actions>
      <UButton
        :to="routes.promoCodesNew()"
        size="sm"
      >
        + Create a promo code
      </UButton>
    </template>

    <template #content>
      <PromoCodesTable />
    </template>
  </LayoutShopWrapperContent>
</template>
