import type { ShopFinancePayoutAccount } from '~/domains/shop/api/finance/contracts/payout-account.contract';
import { useShopFinancePayable } from '~/domains/shop/queries/finance-payable.query';
import { useShopFinancePayoutAccount } from '~/domains/shop/queries/payout-account.query';
import { useShopFinancePayouts } from '~/domains/shop/queries/payouts.query';
import { useShopFinancePayoutSettings } from '~/domains/shop/queries/payout-settings.query';
import ManualPayoutDialog from '../manual-payout-dialog/manual-payout-dialog.vue';

/**
 * The seller's payable balance plus everything that decides whether a manual
 * withdrawal can be requested right now: pending payouts, the monthly allowance,
 * and whether the payout account can receive money.
 */
export function usePayableCard() {
  const { data: payable, isPending, isError } = useShopFinancePayable();
  const {
    data: payoutAccountResponse,
    isPending: isPayoutAccountPending,
    isError: isPayoutAccountError,
  } = useShopFinancePayoutAccount();

  const { data: payoutsResponse } = useShopFinancePayouts();
  const { data: payoutSettings } = useShopFinancePayoutSettings();
  const modal = useModal();

  const payoutAccount = computed<ShopFinancePayoutAccount | null | undefined>(() => (
    isPayoutAccountPending.value || isPayoutAccountError.value
      ? undefined
      : (payoutAccountResponse.value?.payout_account ?? null)
  ));

  const hasPendingPayout = computed(() => (
    payoutsResponse.value?.payouts.some(payout => payout.state === 'pending') ?? false
  ));

  const remaining = computed(() => payoutSettings.value?.manual_withdrawals_remaining);

  const isNegative = computed(() => (
    (payable.value?.available_minor ?? 0) + (payable.value?.not_yet_available_minor ?? 0) < 0
  ));

  /** The reason the withdrawal cannot be requested, or null when it can. */
  const disabledReason = computed(() => {
    if (hasPendingPayout.value) {
      return 'A payout is already pending. Wait for it to finish before withdrawing again.';
    }

    if (remaining.value !== undefined && remaining.value !== null && remaining.value <= 0) {
      return 'You have already made your manual withdrawal this month.';
    }

    if (payoutAccount.value === null) {
      return 'Set up payouts before withdrawing.';
    }

    if (payoutAccount.value && !payoutAccount.value.payouts_enabled) {
      return 'Your payout account is not ready to receive payouts yet.';
    }

    return null;
  });

  function openWithdrawDialog() {
    if (!payable.value || payable.value.available_minor <= 0 || disabledReason.value) {
      return;
    }

    modal.open(ManualPayoutDialog, {
      availableMinor: payable.value.available_minor,
      currency: payable.value.currency,
      targetCurrency: payoutAccount.value?.default_currency ?? payable.value.currency,
    });
  }

  return {
    payable,
    isPending,
    isError,
    remaining,
    isNegative,
    disabledReason,
    openWithdrawDialog,
  };
}
