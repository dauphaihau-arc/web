import type { FormSubmitEvent } from '#ui/types';
import type {
  ShopFinancePayoutAccount,
  StartShopFinancePayoutAccountOnboardingRequest,
} from '~/domains/shop/api/finance/contracts/payout-account.contract';
import { PAYOUT_ACCOUNT_ERROR_MESSAGES } from '~/domains/shop/api/finance/payout-account-error-messages';
import {
  useShopFinancePayoutAccount,
  useShopFinancePayoutAccountCountries,
  useStartShopFinancePayoutAccountOnboarding,
} from '~/domains/shop/queries/payout-account.query';
import { useGetCountries } from '~/domains/location/queries/countries.query';
import { readApiError } from '~/shared/lib/api-error';
import { toastCustom } from '~/shared/config/toast';

type UsePayoutAccountDialogOptions = {
  /** The shop's current Payout Account, when one exists already. */
  account: MaybeRefOrGetter<ShopFinancePayoutAccount | null | undefined>
};

/**
 * The country picker and hosted-onboarding start of the payout account dialog.
 * The ops-owned allowlist decides which countries can be offered; the generic
 * country list only supplies display names.
 */
export function usePayoutAccountDialog(options: UsePayoutAccountDialogOptions) {
  const modal = useModal();
  const toast = useToast();
  const { refetch } = useShopFinancePayoutAccount();
  const { data: countriesResponse } = useGetCountries();

  const {
    data: payoutCountriesResponse,
    isError: isPayoutCountriesError,
  } = useShopFinancePayoutAccountCountries();

  const { mutateAsync: startOnboarding, isPending } = useStartShopFinancePayoutAccountOnboarding();

  /**
   * Set the instant a hosted URL is known and never cleared: the browser leaves
   * for Stripe right after, and the controls must not re-enable in the gap
   * between the mutation settling and the navigation taking effect.
   */
  const isRedirecting = ref(false);

  const isBusy = computed(() => isPending.value || isRedirecting.value);

  /**
   * The ops-owned API allowlist is the only source of offerable countries. The
   * generic country list supplies display names, so the two are intersected and
   * sorted by name; nothing outside the allowlist is ever offered.
   */
  const allowedCountryCodes = computed(() => new Set(
    (payoutCountriesResponse.value?.countries ?? []).map(code => code.toUpperCase()),
  ));

  const countryOptions = computed(() => (countriesResponse.value?.data ?? [])
    .filter(country => country.Iso2 && allowedCountryCodes.value.has(country.Iso2.toUpperCase()))
    .map(country => ({ label: country.name, value: country.Iso2!.toUpperCase() }))
    .sort((left, right) => left.label.localeCompare(right.label)));

  /**
   * Stripe needs the country where the seller's bank account is held. An account
   * that was already started carries its country, so it is never asked again.
   */
  const knownCountry = computed(() => toValue(options.account)?.country ?? '');

  const state = reactive<StartShopFinancePayoutAccountOnboardingRequest>({
    country: knownCountry.value,
  });

  const countryName = computed(() => {
    if (!state.country) {
      return '';
    }

    const code = state.country.toUpperCase();

    // Display names come from the full list so a resumed account whose country
    // has since left the allowlist still reads as a country, not a code.
    return (countriesResponse.value?.data ?? [])
      .find(country => country.Iso2?.toUpperCase() === code)?.name ??
      code;
  });

  const serverError = ref('');

  /**
   * The allowlist is required to offer a country: if it cannot be loaded the
   * picker stays empty and the submit stays disabled rather than offering every
   * country the generic list knows about.
   */
  watch(isPayoutCountriesError, (failed) => {
    if (failed) {
      serverError.value = 'Unable to load the countries where payouts are available. Please try again.';
    }
  }, { immediate: true });

  const canSubmit = computed(() => {
    const country = state.country.trim().toUpperCase();

    if (country.length !== 2) {
      return false;
    }

    // A resumed account already carries an accepted country.
    return Boolean(knownCountry.value) || allowedCountryCodes.value.has(country);
  });

  function closeDialog() {
    modal.close();
  }

  async function submit(event: FormSubmitEvent<StartShopFinancePayoutAccountOnboardingRequest>) {
    serverError.value = '';

    try {
      const result = await startOnboarding({
        country: event.data.country.toUpperCase(),
      });

      if (result.url) {
        isRedirecting.value = true;
        window.location.assign(result.url);
        return;
      }

      // The local adapter activates the destination without a hosted flow, so the
      // card shows the status the refreshed account reports.
      await refetch();
      toast.add({
        ...toastCustom.success,
        title: 'Payout setup complete',
        description: 'Your account can receive payouts.',
      });
      await modal.close();
    }
    catch (error) {
      const apiError = readApiError(error);
      serverError.value = (apiError.code ? PAYOUT_ACCOUNT_ERROR_MESSAGES[apiError.code] : undefined) ??
        apiError.message ??
        'Unable to start payout setup.';
    }
  }

  return {
    isBusy,
    countryOptions,
    knownCountry,
    countryName,
    state,
    serverError,
    canSubmit,
    closeDialog,
    submit,
  };
}
