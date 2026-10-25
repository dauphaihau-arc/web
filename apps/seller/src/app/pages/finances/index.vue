<script lang="ts" setup>
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import PayableCard from './_components/payable-card/payable-card.vue'
import PayoutAccountCard from './_components/payout-account-card/payout-account-card.vue'
import RecentTransactions from './_components/recent-transactions.vue'

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
      <div data-testid="finances-overview">
        <div class="grid gap-4 md:grid-cols-2">
          <PayableCard />
          <PayoutAccountCard />
        </div>

        <RecentTransactions />
      </div>
    </template>
  </LayoutShopWrapperContent>
</template>
