<script lang="ts" setup>
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import PayoutHistory from './_components/payout-history.vue'

definePageMeta({ layout: 'shop', middleware: ['auth'] })
</script>

<template>
  <LayoutShopWrapperContent>
    <template #title>
      Payouts
    </template>
    <template #description>
      Transfers from your Seller Payable to your Payout Account, scheduled or requested manually.
    </template>

    <template #content>
      <PayoutHistory />
    </template>
  </LayoutShopWrapperContent>
</template>
