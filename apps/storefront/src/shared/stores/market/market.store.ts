import { StorageSerializers, useStorage } from '@vueuse/core';
import { LocalStorageKeys } from '@arc/enums/local-storage-keys';
import type { MarketCurrencies, MarketLanguages } from '@arc/enums/market';
import { MARKET_CONFIG } from '@arc/enums/market';
import { SessionStorageKeys } from '@arc/enums/session-storage-keys';
import type { AuthPreferences } from '~/shared/api/auth/contracts/auth-user.contract';
import type { MarketConfigMarket, IpDataResponse } from '~/shared/api/market/contracts/market.contract';
import { currentUserQueryOptions, useGetCurrentUser } from '~/shared/server-state/me/current-user.query';
import { marketConfigQueryOptions } from '~/shared/server-state/market/config.query';
import { getIpData } from '~/shared/server-state/market/ip-data.query';
import type {
  CategoriesBreadcrumbStorage,
  UserActivitiesSessionStorage
} from '~/shared/stores/market/market.store.types';

const COUNTRY_TO_MARKET_MAP: Record<string, string> = {
  'United States of America': 'United States',
  USA: 'United States',
  US: 'United States',
  VN: 'Vietnam',
};

function getBrowserLocale() {
  if (!import.meta.client) {
    return '';
  }

  return navigator.languages?.[0] || navigator.language || '';
}

function localeToMarketLanguage(locale: string, supportedLocales: string[]) {
  const languageCode = locale.split('-')[0]?.toLowerCase();

  if (!languageCode) {
    return undefined;
  }

  const matchedLocale = supportedLocales.find((supportedLocale) => {
    return supportedLocale.split('-')[0]?.toLowerCase() === languageCode;
  });

  return matchedLocale?.split('-')[0]?.toLowerCase() as MarketLanguages | undefined;
}

function resolveSupportedMarket(countryName: string | undefined, enabledMarkets: MarketConfigMarket[]) {
  if (!countryName) {
    return undefined;
  }

  return enabledMarkets.find(market => market.name === countryName) ??
    enabledMarkets.find(market => market.name === COUNTRY_TO_MARKET_MAP[countryName]);
}

function resolveMarketCurrency(
  currencyCode: string | undefined,
  market: MarketConfigMarket
): MarketCurrencies {
  if (currencyCode && market.supportedCurrencies.includes(currencyCode as MarketCurrencies)) {
    return currencyCode as MarketCurrencies;
  }

  return market.defaultCurrency;
}

function getBaseMarket(): MarketConfigMarket {
  return {
    code: 'US',
    name: MARKET_CONFIG.BASE_REGION,
    defaultCurrency: MARKET_CONFIG.BASE_CURRENCY,
    supportedCurrencies: [MARKET_CONFIG.BASE_CURRENCY],
    defaultLocale: `${MARKET_CONFIG.BASE_LANGUAGE}-US`,
    supportedLocales: [`${MARKET_CONFIG.BASE_LANGUAGE}-US`],
    enabled: true,
  };
}

type MarketPreferenceSource =
  | 'user_preferences'
  | 'guest_preferences'
  | 'ip_lookup'
  | 'fallback';

export const useMarketStore = defineStore('market', () => {
  const queryClient = useQueryClient();
  const { data: dataUserAuth } = useGetCurrentUser();

  const categoriesBreadcrumb = useStorage(
    SessionStorageKeys.CATEGORIES_BREADCRUMB,
    parseJSON<CategoriesBreadcrumbStorage[]>(sessionStorage.getItem(SessionStorageKeys.CATEGORIES_BREADCRUMB)) || [],
    sessionStorage // bind value with SS
  );

  const userActivities = useStorage<Partial<UserActivitiesSessionStorage>>(
    SessionStorageKeys.USER_ACTIVITIES,
    parseJSON<UserActivitiesSessionStorage>(
      sessionStorage.getItem(SessionStorageKeys.USER_ACTIVITIES)
    ) || {},
    sessionStorage // bind value with SS
  );

  const guestPreferences = useStorage<AuthPreferences>(
    LocalStorageKeys.GUEST_PREFERENCES,
    localStorage[LocalStorageKeys.GUEST_PREFERENCES],
    localStorage, // bind value with LS
    {
      serializer: StorageSerializers.object,
    }
  );

  const marketPreferenceSource = ref<MarketPreferenceSource | null>(null);
  const isMarketReady = ref(false);
  const marketReadyPromise = shallowRef<Promise<void> | null>(null);

  const markMarketReady = (
    preferences: AuthPreferences,
    source: MarketPreferenceSource
  ) => {
    guestPreferences.value = preferences;
    marketPreferenceSource.value = source;
    isMarketReady.value = true;
  };

  const resolveFallbackPreferences = (): AuthPreferences => ({
    currency: MARKET_CONFIG.BASE_CURRENCY,
    language: MARKET_CONFIG.BASE_LANGUAGE,
    region: MARKET_CONFIG.BASE_REGION,
  });

  // sync with LS
  watch(() => dataUserAuth.value?.user, () => {
    if (dataUserAuth.value?.user?.preferences) {
      markMarketReady(dataUserAuth.value.user.preferences, 'user_preferences');
      return;
    }

    if (guestPreferences.value) {
      marketPreferenceSource.value ??= 'guest_preferences';
      isMarketReady.value = true;
    }
  });

  async function ensureMarketReady() {
    if (dataUserAuth.value?.user?.preferences) {
      markMarketReady(dataUserAuth.value.user.preferences, 'user_preferences');
      return;
    }

    if (guestPreferences.value) {
      marketPreferenceSource.value ??= 'guest_preferences';
      isMarketReady.value = true;
      return;
    }

    if (marketReadyPromise.value) {
      await marketReadyPromise.value;
      return;
    }

    marketReadyPromise.value = (async () => {
      const [currentUser, ipData, marketConfig] = await Promise.all([
        queryClient.ensureQueryData(currentUserQueryOptions).catch(() => undefined),
        getIpData().catch(() => undefined),
        queryClient.fetchQuery(marketConfigQueryOptions).catch(() => undefined),
      ]);
      const userPreferences = currentUser?.user?.preferences;

      if (userPreferences) {
        markMarketReady(userPreferences, 'user_preferences');
        return;
      }

      if (guestPreferences.value) {
        marketPreferenceSource.value ??= 'guest_preferences';
        isMarketReady.value = true;
        return;
      }

      if (!ipData) {
        markMarketReady(resolveFallbackPreferences(), 'fallback');
        return;
      }

      const enabledMarkets = marketConfig?.markets.filter(market => market.enabled) ?? [];
      const market = resolveSupportedMarket(
        (ipData as IpDataResponse).country_name,
        enabledMarkets
      ) ?? getBaseMarket();
      const language = localeToMarketLanguage(
        getBrowserLocale(),
        market.supportedLocales
      ) ?? localeToMarketLanguage(market.defaultLocale, market.supportedLocales) ??
      MARKET_CONFIG.BASE_LANGUAGE;

      markMarketReady({
        currency: resolveMarketCurrency((ipData as IpDataResponse).currency?.code, market),
        language,
        region: market.name,
      }, marketConfig ? 'ip_lookup' : 'fallback');
    })();

    try {
      await marketReadyPromise.value;
    }
    finally {
      marketReadyPromise.value = null;
    }
  }

  if (guestPreferences.value) {
    marketPreferenceSource.value = 'guest_preferences';
    isMarketReady.value = true;
  }

  const clearCategoryRecommendationState = () => {
    userActivities.value = {
      ...userActivities.value,
      categoryIdProductVisited: undefined,
      rootCategoryProductVisited: undefined,
      subCategoriesLastVisit: undefined,
    };
    categoriesBreadcrumb.value = [];
  };

  return {
    userActivities,
    guestPreferences,
    marketPreferenceSource,
    isMarketReady,
    marketReadyPromise,
    categoriesBreadcrumb,
    ensureMarketReady,
    clearCategoryRecommendationState,
  };
});
