import { StorageSerializers, useStorage } from '@vueuse/core';
import { LocalStorageKeys } from '@arc/enums/local-storage-keys';
import type { MarketCurrencies, MarketLanguages } from '@arc/enums/market';
import { MARKET_CONFIG } from '@arc/enums/market';
import { SessionStorageKeys } from '@arc/enums/session-storage-keys';
import type { AuthPreferences } from '~/shared/api/auth/contracts/auth-user.contract';
import type { MarketConfigMarket, IpDataResponse } from '~/shared/api/market/contracts/market.contract';
import {
  GUEST_PREFERENCES_COOKIE_KEY,
  getFallbackMarketPreferences,
  sanitizeMarketPreferences
} from '~/shared/stores/market/market-preferences';
import { currentUserQueryOptions, useGetCurrentUser } from '~/shared/server-state/me/current-user.query';
import { marketConfigQueryOptions } from '~/shared/server-state/market/config.query';
import { getIpData } from '~/shared/server-state/market/ip-data.query';
import type {
  CategoriesBreadcrumbStorage,
  RecentProductViewStorage,
  UserActivitiesSessionStorage
} from '~/shared/stores/market/market.store.types';

const MAX_RECENT_PRODUCT_VIEWS = 24;

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

function createMemoryStorage(): Storage {
  const storage = new Map<string, string>();

  return {
    get length() {
      return storage.size;
    },
    clear() {
      storage.clear();
    },
    getItem(key: string) {
      return storage.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(storage.keys())[index] ?? null;
    },
    removeItem(key: string) {
      storage.delete(key);
    },
    setItem(key: string, value: string) {
      storage.set(key, value);
    },
  };
}

function readStoredObject<T>(storage: Storage, key: string): T | null {
  const value = storage.getItem(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  }
  catch {
    return null;
  }
}

export const useMarketStore = defineStore('market', () => {
  const queryClient = useQueryClient();
  const { data: dataUserAuth } = useGetCurrentUser();
  const sessionStorageRef = import.meta.client ? sessionStorage : createMemoryStorage();
  const localStorageRef = import.meta.client ? localStorage : createMemoryStorage();

  const categoriesBreadcrumb = useStorage(
    SessionStorageKeys.CATEGORIES_BREADCRUMB,
    readStoredObject<CategoriesBreadcrumbStorage[]>(
      sessionStorageRef,
      SessionStorageKeys.CATEGORIES_BREADCRUMB
    ) || [],
    sessionStorageRef
  );

  const userActivities = useStorage<Partial<UserActivitiesSessionStorage>>(
    SessionStorageKeys.USER_ACTIVITIES,
    readStoredObject<UserActivitiesSessionStorage>(
      sessionStorageRef,
      SessionStorageKeys.USER_ACTIVITIES
    ) || {},
    sessionStorageRef
  );

  const recentProductViews = useStorage<RecentProductViewStorage[]>(
    LocalStorageKeys.RECENT_PRODUCT_VIEWS,
    readStoredObject<RecentProductViewStorage[]>(
      localStorageRef,
      LocalStorageKeys.RECENT_PRODUCT_VIEWS
    ) || [],
    localStorageRef,
    {
      serializer: StorageSerializers.object,
    }
  );

  const guestPreferencesCookie = useCookie<AuthPreferences | null>(
    GUEST_PREFERENCES_COOKIE_KEY,
    {
      default: () => null,
      sameSite: 'lax',
    }
  );

  const persistedGuestPreferences = sanitizeMarketPreferences(
    import.meta.client ?
      readStoredObject<AuthPreferences>(
        localStorageRef,
        LocalStorageKeys.GUEST_PREFERENCES
      ) ?? guestPreferencesCookie.value :
      guestPreferencesCookie.value
  );

  const guestPreferences = useStorage<AuthPreferences | null>(
    LocalStorageKeys.GUEST_PREFERENCES,
    persistedGuestPreferences,
    localStorageRef,
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
    guestPreferencesCookie.value = preferences;
    marketPreferenceSource.value = source;
    isMarketReady.value = true;
  };

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
        markMarketReady(getFallbackMarketPreferences(), 'fallback');
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

  watch(guestPreferences, (preferences) => {
    guestPreferencesCookie.value = sanitizeMarketPreferences(preferences);
  }, { deep: true });

  const clearCategoryRecommendationState = () => {
    userActivities.value = {
      ...userActivities.value,
      categoryIdProductVisited: undefined,
      rootCategoryProductVisited: undefined,
      subCategoriesLastVisit: undefined,
    };
    categoriesBreadcrumb.value = [];
  };

  const recordRecentProductView = (product: RecentProductViewStorage['product']) => {
    const nextEntry: RecentProductViewStorage = {
      product,
      viewedAt: new Date().toISOString(),
    };
    const dedupedEntries = recentProductViews.value.filter(
      entry => entry.product.id !== product.id
    );

    recentProductViews.value = [
      nextEntry,
      ...dedupedEntries,
    ].slice(0, MAX_RECENT_PRODUCT_VIEWS);
  };

  const clearRecentProductViews = () => {
    recentProductViews.value = [];
  };

  return {
    userActivities,
    recentProductViews,
    guestPreferences,
    marketPreferenceSource,
    isMarketReady,
    marketReadyPromise,
    categoriesBreadcrumb,
    ensureMarketReady,
    clearCategoryRecommendationState,
    recordRecentProductView,
    clearRecentProductViews,
  };
});
