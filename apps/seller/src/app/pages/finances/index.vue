<script lang="ts" setup>
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import PayableCard from './_components/payable-card.vue'
import PayoutAccountCard from './_components/payout-account-card.vue'
import PayoutHistory from './_components/payout-history.vue'

definePageMeta({ layout: 'shop', middleware: ['auth'] })
</script>

<template>
  <LayoutShopWrapperContent content-class="pb-20">
    <template #title>
      Finances
    </template>
    <template #description>
      Your Seller Payable in your shop's currency: what can be paid out now and what is still being held.
    </template>

    <template #content>
      <div class="grid gap-4 md:grid-cols-2">
        <PayableCard />
        <PayoutAccountCard />
      </div>

      <PayoutHistory />
    </template>
  </LayoutShopWrapperContent>
</template>
