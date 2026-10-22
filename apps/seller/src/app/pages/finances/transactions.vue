<script lang="ts" setup>
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import TransactionsPanel from './_components/transactions-panel.vue'

definePageMeta({ layout: 'shop', middleware: ['auth'] })
</script>

<template>
  <LayoutShopWrapperContent>
    <template #title>
      Transactions
    </template>
    <template #description>
      Every movement on your Seller Payable: order income, refunds, and payouts.
    </template>

    <template #content>
      <TransactionsPanel />
    </template>
  </LayoutShopWrapperContent>
</template>
