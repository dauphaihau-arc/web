import {
  MARKET_CONFIG,
  MarketCurrencies,
  MarketRegions,
  StorefrontLanguages,
} from '@arc/enums/market';
import {
  defaultCurrencyOption,
  toCurrencyOption,
  type CurrencyOption,
} from '@arc/utils/currency-options';
import {
  computed, reactive, unref, watch,
  type ComputedRef, type MaybeRef, type Ref,
} from 'vue';
import {
  defaultLanguageOption,
  localeToLanguageOption,
  type LanguageOption,
  type PreferenceState,
} from './preference-options';
import type { AuthPreferences } from '~/domains/auth/api/contracts/auth-user.contract';
import type {
  MarketConfigMarket,
  MarketConfigResponse,
} from '~/domains/market/api/contracts/market.contract';

function toMarketEnum<T extends string>(values: readonly T[], value: string): T | undefined {
  return values.find(candidate => candidate === value);
}

type UseUserPreferenceFormParams = {
  currentUserPreferences: ComputedRef<AuthPreferences | undefined>
  marketConfig: Ref<MarketConfigResponse | undefined>
  /**
   * When provided, this language wins over the stored preference during
   * market normalisation. The preferences dialog uses it so the URL locale is
   * never silently replaced by a stale Buyer Language Preference.
   */
  languageOverride?: MaybeRef<StorefrontLanguages | undefined>
};

export function useUserPreferenceForm({
  currentUserPreferences,
  marketConfig,
  languageOverride,
}: UseUserPreferenceFormParams) {
  const state = reactive<PreferenceState>({
    region: MARKET_CONFIG.BASE_REGION,
    language: defaultLanguageOption.id,
    currency: defaultCurrencyOption.id,
  });

  const enabledMarkets = computed<MarketConfigMarket[]>(() => {
    return marketConfig.value?.markets.filter(market => market.enabled) ?? [];
  });

  const selectedMarket = computed(() => {
    return enabledMarkets.value.find(market => market.name === state.region);
  });

  const currencyOptions = computed<CurrencyOption[]>(() => {
    if (!selectedMarket.value) {
      return [defaultCurrencyOption];
    }

    return selectedMarket.value.supportedCurrencies.map(toCurrencyOption);
  });

  const languageOptions = computed<LanguageOption[]>(() => {
    if (!selectedMarket.value) {
      return [defaultLanguageOption];
    }

    const options = selectedMarket.value.supportedLocales
      .map(localeToLanguageOption)
      .filter((option): option is LanguageOption => !!option);

    if (options.length === 0) {
      return [defaultLanguageOption];
    }

    return Array.from(new Map(options.map(option => [option.id, option])).values());
  });

  const regionOptions = computed(() => {
    return enabledMarkets.value.map(market => market.name);
  });

  const selectedCurrencyOption = computed(() => {
    return currencyOptions.value.find(option => option.id === state.currency) ?? defaultCurrencyOption;
  });

  function hydrateForm(preferences?: AuthPreferences) {
    if (!preferences) {
      return;
    }

    const region = toMarketEnum(Object.values(MarketRegions), preferences.region);
    const language = toMarketEnum(Object.values(StorefrontLanguages), preferences.language);
    const currency = toMarketEnum(Object.values(MarketCurrencies), preferences.currency);

    if (region && language && currency) {
      state.region = region;
      state.language = (languageOverride ? unref(languageOverride) : undefined) ?? language;
      state.currency = currency;
    }
  }

  function normalizeForSelectedMarket() {
    const market = selectedMarket.value;

    if (!market) {
      return;
    }

    const preferredCurrency = currentUserPreferences.value?.currency;
    const nextCurrency = currencyOptions.value.find((option) => {
      return option.id === preferredCurrency || option.id === state.currency;
    });
    state.currency = nextCurrency?.id ?? market.defaultCurrency;

    // The form's language fallback is always English rather than the market
    // default: the preferences form persists a Buyer Language Preference, it
    // does not decide which URL locale is rendered.
    const overrideLanguage = languageOverride ? unref(languageOverride) : undefined;

    if (overrideLanguage && state.language === overrideLanguage) {
      // The URL locale is the source of truth while the dialog is open, so the
      // stored preference must never replace it during normalisation. Once the
      // buyer picks another language this branch falls through and the usual
      // market validation applies.
      state.language = overrideLanguage;
      return;
    }

    const preferredLanguage = currentUserPreferences.value?.language;
    const nextLanguage = languageOptions.value.find((option) => {
      return option.id === preferredLanguage || option.id === state.language;
    }) ?? defaultLanguageOption;

    state.language = nextLanguage.id;
  }

  watch(currentUserPreferences, (preferences) => {
    hydrateForm(preferences);
  }, { immediate: true });

  watch(() => state.region, () => {
    normalizeForSelectedMarket();
  }, { immediate: true });

  return {
    currencyOptions,
    languageOptions,
    regionOptions,
    selectedCurrencyOption,
    state,
  };
}
