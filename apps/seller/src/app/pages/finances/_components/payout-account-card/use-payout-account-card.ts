import type { ShopFinancePayoutAccount } from '~/domains/shop/api/finance/contracts/payout-account.contract';
import {
  useShopFinancePayoutAccount,
  useStartShopFinancePayoutAccountOnboarding,
} from '~/domains/shop/queries/payout-account.query';
import { useGetCountries } from '~/domains/location/queries/countries.query';
import { PAYOUT_ACCOUNT_ERROR_MESSAGES } from '~/domains/shop/api/finance/payout-account-error-messages';
import { readApiError } from '~/shared/lib/api-error';
import { toastCustom } from '~/shared/config/toast';
import PayoutAccountDialog from '../payout-account-dialog/payout-account-dialog.vue';
import {
  payoutAccountDisabledReasonText,
  payoutAccountRequirementTexts,
  payoutAccountStatusMeta,
} from '../payout-account-status';

const POLL_INTERVAL_MS = 10_000;

/**
 * The payout account the seller has (or is about to have), its provider-owned
 * status, and the onboarding action that moves it forward. The card itself only
 * picks which state to render from the flags this composable derives.
 */
export function usePayoutAccountCard() {
  const {
    data: response,
    isPending,
    isError,
    refetch,
  } = useShopFinancePayoutAccount();

  const {
    mutateAsync: startOnboarding,
    isPending: isStartingOnboarding,
  } = useStartShopFinancePayoutAccountOnboarding();

  // The shared cache keeps this off the network when the payout dialog already
  // loaded the list, and the code stays readable until it arrives.
  const { data: countriesResponse } = useGetCountries();

  const modal = useModal();
  const toast = useToast();

  const account = computed(() => response.value?.payout_account ?? null);

  /**
   * Starting onboarding makes the backend report the account as `onboarding`
   * before the browser reaches Stripe, which would otherwise flip the card to an
   * empty state under the seller's cursor. The snapshot keeps the state that was
   * clicked until the browser leaves, and `isRedirecting` stays set after the
   * hosted URL is assigned so the card cannot re-render in the gap.
   */
  const frozenAccount = ref<ShopFinancePayoutAccount | null>(null);
  const isRedirecting = ref(false);

  const isBusy = computed(() => isStartingOnboarding.value || isRedirecting.value);

  const displayAccount = computed(() => (
    isBusy.value && frozenAccount.value ? frozenAccount.value : account.value
  ));

  const status = computed(() => (
    displayAccount.value ? payoutAccountStatusMeta[displayAccount.value.status] : null
  ));

  /** Stripe is still collecting the seller's details for the first time. */
  const isOnboarding = computed(() => displayAccount.value?.status === 'onboarding');

  /** Stripe needs more information before it can review the account. */
  const isActionRequired = computed(() => (
    displayAccount.value?.status === 'action_required'
  ));

  const isActive = computed(() => displayAccount.value?.status === 'active');

  /** A restricted or disabled account can receive nothing; explain why. */
  const isBlocked = computed(() => (
    displayAccount.value?.status === 'restricted'
    || displayAccount.value?.status === 'disabled'
  ));

  /** A restricted account can still be fixed by completing Stripe's requirements. */
  const isRestricted = computed(() => displayAccount.value?.status === 'restricted');

  /**
   * Stripe reviews an account outside the app and its webhook can land after the
   * browser returns from hosted onboarding, so a status that Stripe can still
   * change on its own is re-read until it settles. An unknown account only
   * changes after a user action, so it is never polled. This reads the live
   * account, not the frozen snapshot, so polling can still observe the settle.
   */
  const isAwaitingProvider = computed(() => (
    account.value?.status === 'onboarding'
    || account.value?.status === 'action_required'
  ));

  /**
   * Refetching while the tab is hidden would waste requests; the focus event and
   * visibility change cover the seller coming back from hosted onboarding.
   */
  function refreshPayoutAccount() {
    if (!isAwaitingProvider.value || document.visibilityState === 'hidden') {
      return;
    }

    void refetch();
  }

  const { pause: pausePolling, resume: resumePolling } = useIntervalFn(
    refreshPayoutAccount,
    POLL_INTERVAL_MS,
    { immediate: false },
  );

  // The interval only exists while the provider can still change the status on
  // its own, and VueUse stops it when the card unmounts.
  watch(isAwaitingProvider, (awaiting) => {
    if (awaiting && import.meta.client) {
      resumePolling();
      return;
    }

    pausePolling();
  }, { immediate: true });

  useEventListener('focus', refreshPayoutAccount);
  useEventListener(document, 'visibilitychange', refreshPayoutAccount);

  /** The account's country reads as a name; the code stands in until it loads. */
  const countryLabel = computed(() => {
    const code = displayAccount.value?.country ?? '';

    if (!code) {
      return '';
    }

    const iso2 = code.toUpperCase();

    return (countriesResponse.value?.data ?? [])
      .find(country => country.Iso2?.toUpperCase() === iso2)?.name ?? code;
  });
  const payoutCurrency = computed(() => (
    displayAccount.value?.default_currency ?? displayAccount.value?.currency ?? ''
  ));
  /** The bank line only appears when the provider reported both parts. */
  const bankSummary = computed(() => {
    const bankName = displayAccount.value?.bank_name;
    const last4 = displayAccount.value?.last4;

    return bankName && last4 ? `${bankName} •••• ${last4}` : null;
  });
  const requirementTexts = computed(() => (
    displayAccount.value ? payoutAccountRequirementTexts(displayAccount.value) : []
  ));
  const disabledReasonText = computed(() => (
    displayAccount.value ? payoutAccountDisabledReasonText(displayAccount.value) : null
  ));
  const blockedDescription = computed(() => (
    disabledReasonText.value ??
    status.value?.description ??
    'Payouts are unavailable for this account.'
  ));

  function openOnboardingDialog() {
    modal.open(PayoutAccountDialog, { account: account.value });
  }

  /**
   * Resumes onboarding with the country the account was opened in. A hosted URL
   * leaves the app; a null URL means the local adapter activated the account, so
   * the card re-reads it and shows the status that resulted.
   */
  async function continueOnboarding() {
    if (!account.value || isBusy.value) {
      return;
    }

    // Freeze first so the mutation's own pending state and the refetch that
    // follows the POST cannot swap the card out from under the seller.
    frozenAccount.value = account.value;

    try {
      const result = await startOnboarding({ country: account.value.country });

      if (result.url) {
        isRedirecting.value = true;
        window.location.assign(result.url);
        return;
      }

      // No hosted URL: the local state is authoritative again.
      frozenAccount.value = null;
      await refetch();
    }
    catch (error) {
      // The attempt failed, so the live account is the truth again.
      frozenAccount.value = null;
      const apiError = readApiError(error);
      toast.add({
        ...toastCustom.error,
        title: 'Unable to start payout setup',
        description: (apiError.code ? PAYOUT_ACCOUNT_ERROR_MESSAGES[apiError.code] : undefined) ??
          apiError.message ??
          'Try again in a moment.',
      });
    }
  }

  return {
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
  };
}
