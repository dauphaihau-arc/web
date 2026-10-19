<script lang="ts" setup>
import Empty from '@arc/ui/primitives/empty.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import PayableCard from './_components/payable-card.vue'
import PayoutAccountCard from './_components/payout-account-card.vue'
import PayoutAccountDialog from './_components/payout-account-dialog.vue'
import { useShopFinancePayable } from '~/domains/shop/queries/finance-payable.query'
import { useShopFinancePayoutAccount } from '~/domains/shop/queries/payout-account.query'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

const { data: payable, isPending, isError: isPayableError } = useShopFinancePayable()

const modal = useModal()
const {
  data: payoutAccountResponse,
  isPending: isPayoutAccountPending,
  isError: isPayoutAccountError,
} = useShopFinancePayoutAccount()

const payoutAccount = computed(() => payoutAccountResponse.value?.payout_account ?? null)

function openPayoutAccountDialog() {
  modal.open(PayoutAccountDialog, { account: payoutAccount.value })
}
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
        <div
          v-if="isPending"
          class="rounded-lg border border-border-subtle bg-surface p-5"
        >
          <USkeleton class="h-5 w-16" />
          <USkeleton class="mt-5 h-8 w-32" />
          <USkeleton class="mt-4 h-8 w-32" />
        </div>

        <Empty
          v-else-if="isPayableError || !payable"
          title="Unable to load balance"
          description="Reload the page to try again."
        />

        <PayableCard
          v-else
          :payable="payable"
        />

        <div
          v-if="isPayoutAccountPending"
          class="rounded-lg border border-border-subtle bg-surface p-5"
        >
          <USkeleton class="h-5 w-32" />
          <USkeleton class="mt-5 h-8 w-48" />
          <USkeleton class="mt-4 h-5 w-40" />
        </div>

        <Empty
          v-else-if="isPayoutAccountError"
          title="Unable to load payout account"
          description="Reload the page to try again."
        />

        <Empty
          v-else-if="!payoutAccount"
          icon="payment"
          size="lg"
          title="No payout account yet"
          description="Add the bank account you want to be paid into"
        >
          <template #actions>
            <UButton
              icon="i-heroicons-plus"
              @click="openPayoutAccountDialog"
            >
              Add bank account
            </UButton>
          </template>
        </Empty>

        <PayoutAccountCard
          v-else
          :account="payoutAccount"
          @replace="openPayoutAccountDialog"
        />
      </div>
    </template>
  </LayoutShopWrapperContent>
</template>
