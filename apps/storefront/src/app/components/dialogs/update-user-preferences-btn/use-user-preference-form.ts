import { MARKET_CONFIG } from '@arc/enums/market'
import { computed, reactive, watch, type ComputedRef, type Ref } from 'vue'
import type { AuthPreferences } from '~/shared/api/auth/contracts/auth-user.contract'
import type { MarketConfigMarket } from '~/shared/api/market/contracts/market.contract'
import {
  defaultCurrencyOption,
  defaultLanguageOption,
  localeToLanguageOption,
  toCurrencyOption,
  type CurrencyOption,
  type LanguageOption,
  type PreferenceState,
} from './preference-options'

type MarketConfigResponse = {
  markets: MarketConfigMarket[]
}

type UseUserPreferenceFormParams = {
  currentUserPreferences: ComputedRef<AuthPreferences | undefined>
  marketConfig: Ref<MarketConfigResponse | undefined>
}

export function useUserPreferenceForm({
  currentUserPreferences,
  marketConfig,
}: UseUserPreferenceFormParams) {
  const state = reactive<PreferenceState>({
    region: MARKET_CONFIG.BASE_REGION,
    language: defaultLanguageOption.id,
    currency: defaultCurrencyOption.id,
  })

  const enabledMarkets = computed<MarketConfigMarket[]>(() => {
    return marketConfig.value?.markets.filter(market => market.enabled) ?? []
  })

  const selectedMarket = computed(() => {
    return enabledMarkets.value.find(market => market.name === state.region)
  })

  const currencyOptions = computed<CurrencyOption[]>(() => {
    if (!selectedMarket.value) {
      return [defaultCurrencyOption]
    }

    return selectedMarket.value.supportedCurrencies.map(toCurrencyOption)
  })

  const languageOptions = computed<LanguageOption[]>(() => {
    if (!selectedMarket.value) {
      return [defaultLanguageOption]
    }

    const options = selectedMarket.value.supportedLocales
      .map(localeToLanguageOption)
      .filter((option): option is LanguageOption => !!option)

    if (options.length === 0) {
      return [defaultLanguageOption]
    }

    return Array.from(new Map(options.map(option => [option.id, option])).values())
  })

  const regionOptions = computed(() => {
    return enabledMarkets.value.map(market => market.name)
  })

  const selectedCurrencyOption = computed(() => {
    return currencyOptions.value.find(option => option.id === state.currency) ?? defaultCurrencyOption
  })

  function hydrateForm(preferences?: AuthPreferences) {
    if (!preferences) {
      return
    }

    state.region = preferences.region
    state.language = preferences.language
    state.currency = preferences.currency
  }

  function normalizeForSelectedMarket() {
    const market = selectedMarket.value

    if (!market) {
      return
    }

    const preferredCurrency = currentUserPreferences.value?.currency
    const nextCurrency = currencyOptions.value.find((option) => {
      return option.id === preferredCurrency || option.id === state.currency
    })
    state.currency = nextCurrency?.id ?? market.defaultCurrency

    const preferredLanguage = currentUserPreferences.value?.language
    const nextLanguage = languageOptions.value.find((option) => {
      return option.id === preferredLanguage || option.id === state.language
    })
      ?? localeToLanguageOption(market.defaultLocale)
      ?? defaultLanguageOption

    state.language = nextLanguage.id
  }

  watch(currentUserPreferences, (preferences) => {
    hydrateForm(preferences)
  }, { immediate: true })

  watch(() => state.region, () => {
    normalizeForSelectedMarket()
  }, { immediate: true })

  return {
    currencyOptions,
    languageOptions,
    regionOptions,
    selectedCurrencyOption,
    state,
  }
}
