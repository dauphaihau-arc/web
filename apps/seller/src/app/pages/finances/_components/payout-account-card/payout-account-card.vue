<script setup lang="ts">
import { usePayoutAccountCard } from './use-payout-account-card'
import PayoutAccountLoadingState from './payout-account-loading-state.vue'
import PayoutAccountErrorState from './payout-account-error-state.vue'
import PayoutAccountSetupState from './payout-account-setup-state.vue'
import PayoutAccountOnboardingState from './payout-account-onboarding-state.vue'
import PayoutAccountBlockedState from './payout-account-blocked-state.vue'
import PayoutAccountDetailState from './payout-account-detail-state.vue'

const {
  isPending,
  isError,
  displayAccount,
  status,
  isBusy,
  isOnboarding,
  isActionRequired,
  isActive,
  isBlocked,
  isRestricted,
  countryLabel,
  payoutCurrency,
  bankSummary,
  requirementTexts,
  blockedDescription,
  openOnboardingDialog,
  continueOnboarding,
} = usePayoutAccountCard()
</script>

<template>
  <PayoutAccountLoadingState v-if="isPending" />

  <PayoutAccountErrorState v-else-if="isError" />

  <PayoutAccountSetupState
    v-else-if="!displayAccount"
    @setup="openOnboardingDialog"
  />

  <PayoutAccountOnboardingState
    v-else-if="isOnboarding"
    :is-busy="isBusy"
    @continue-onboarding="continueOnboarding"
  />

  <PayoutAccountBlockedState
    v-else-if="isBlocked"
    :title="status?.label ?? 'Payouts are unavailable'"
    :description="blockedDescription"
    :is-restricted="isRestricted"
    :is-busy="isBusy"
    :requirement-texts="requirementTexts"
    @continue-onboarding="continueOnboarding"
  />

  <PayoutAccountDetailState
    v-else
    :status="status"
    :is-active="isActive"
    :is-action-required="isActionRequired"
    :is-busy="isBusy"
    :bank-summary="bankSummary"
    :payout-currency="payoutCurrency"
    :country-label="countryLabel"
    @continue-onboarding="continueOnboarding"
  />
</template>
