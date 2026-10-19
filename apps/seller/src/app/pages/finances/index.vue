<script lang="ts" setup>
import { formatMinorCurrency } from '@arc/utils'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import PayoutAccountDialog from './_components/payout-account-dialog.vue'
import { useShopFinancePayable } from '~/domains/shop/queries/finance-payable.query'
import { useShopFinancePayoutAccount } from '~/domains/shop/queries/payout-account.query'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

const { data: payable, isPending } = useShopFinancePayable()

const modal = useModal()
const {
  data: payoutAccountResponse,
  isPending: isPayoutAccountPending,
  isError: isPayoutAccountError,
} = useShopFinancePayoutAccount()
const payoutAccount = computed(() => payoutAccountResponse.value?.payout_account ?? null)

const payoutAccountStatus = {
  pending: { label: 'Pending', color: 'yellow' },
  active: { label: 'Active', color: 'green' },
  disabled: { label: 'Disabled', color: 'gray' },
} as const

function openPayoutAccountDialog() {
  modal.open(PayoutAccountDialog, { account: payoutAccount.value })
}

const hasBalance = computed(() => {
  if (!payable.value) return false

  return payable.value.available_minor !== 0 || payable.value.not_yet_available_minor !== 0
})
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

        <div
          v-else-if="!hasBalance"
          class="rounded-lg border border-border-subtle bg-surface p-10 text-center"
        >
          <p class="text-sm font-medium text-text-strong">
            No payable balance yet
          </p>
          <p class="mt-1 text-sm text-text-subtle">
            Your available and not-yet-available balances appear here once you have sales.
          </p>
        </div>

        <div
          v-else
          class="rounded-lg border border-border-subtle bg-surface p-5"
        >
          <div class="flex items-center gap-2">
            <AppIcon
              name="revenue"
              size="xs"
              class="text-text-subtle"
            />
            <span class="text-sm font-medium text-text-muted">{{ payable?.currency }}</span>
          </div>

          <div class="mt-4">
            <div class="text-sm text-text-muted">
              Available
            </div>
            <div class="mt-1 text-2xl font-semibold text-text-strong">
              {{ formatMinorCurrency(payable?.available_minor ?? 0, payable?.currency ?? '') }}
            </div>
          </div>

          <div class="mt-4 border-t border-border-subtle pt-4">
            <div class="text-sm text-text-muted">
              Not yet available
            </div>
            <div class="mt-1 text-2xl font-semibold text-text-strong">
              {{ formatMinorCurrency(payable?.not_yet_available_minor ?? 0, payable?.currency ?? '') }}
            </div>
          </div>
        </div>

        <div
          v-if="isPayoutAccountPending"
          class="rounded-lg border border-border-subtle bg-surface p-5"
        >
          <USkeleton class="h-5 w-32" />
          <USkeleton class="mt-5 h-8 w-48" />
          <USkeleton class="mt-4 h-5 w-40" />
        </div>

        <div
          v-else-if="isPayoutAccountError"
          class="rounded-lg border border-border-subtle bg-surface p-5"
        >
          <UAlert
            color="red"
            variant="subtle"
            title="Unable to load payout account"
            description="Reload the page to try again."
          />
        </div>

        <div
          v-else-if="!payoutAccount"
          class="rounded-lg border border-border-subtle bg-surface p-10 text-center"
        >
          <AppIcon
            name="payment"
            size="3xl"
            class="text-text-subtle"
          />
          <p class="mt-3 text-sm font-medium text-text-strong">
            No payout account yet
          </p>
          <p class="mt-1 text-sm text-text-subtle">
            Add the bank account you want to be paid into
          </p>
          <UButton
            class="mt-5"
            icon="i-heroicons-plus"
            @click="openPayoutAccountDialog"
          >
            Add bank account
          </UButton>
        </div>

        <div
          v-else
          class="rounded-lg border border-border-subtle bg-surface p-5"
        >
          <div class="flex items-center gap-2">
            <AppIcon
              name="payment"
              size="xs"
              class="text-text-subtle"
            />
            <span class="text-sm font-medium text-text-muted">Payout account</span>
            <StatusBadge
              class="ml-auto"
              :label="payoutAccountStatus[payoutAccount.status].label"
              :color="payoutAccountStatus[payoutAccount.status].color"
            />
          </div>

          <div class="mt-4">
            <div class="text-sm text-text-muted">
              Bank
            </div>
            <div class="mt-1 text-lg font-semibold text-text-strong">
              {{ payoutAccount.bank_name }} ••{{ payoutAccount.last4 }}
            </div>
          </div>

          <div class="mt-4 border-t border-border-subtle pt-4">
            <div class="text-sm text-text-muted">
              Account holder
            </div>
            <div class="mt-1 text-sm font-medium text-text-strong">
              {{ payoutAccount.holder_name }}
            </div>
          </div>

          <UButton
            class="mt-4"
            color="gray"
            @click="openPayoutAccountDialog"
          >
            Replace bank account
          </UButton>
        </div>
      </div>
    </template>
  </LayoutShopWrapperContent>
</template>
