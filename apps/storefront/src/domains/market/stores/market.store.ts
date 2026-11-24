import { StorageSerializers, useStorage } from '@vueuse/core';
import { LocalStorageKeys } from '@arc/enums/local-storage-keys';
import type { MarketCurrencies } from '@arc/enums/market';
import { MARKET_CONFIG } from '@arc/enums/market';
import { SessionStorageKeys } from '@arc/enums/session-storage-keys';
import type { AuthPreferences } from '~/domains/auth/api/contracts/auth-user.contract';
import {
  resolvePreviewCountryCode,
  type MarketConfigMarket,
  type MarketConfigResponse,
  type IpDataResponse,
} from '~/domains/market/api/contracts/market.contract';
import {
  GUEST_PREFERENCES_COOKIE_KEY,
  getFallbackMarketPreferences,
  sanitizeMarketPreferences,
} from '~/domains/market/stores/market-preferences';
import { currentUserQueryOptions, useGetCurrentUser } from '~/domains/me/queries/current-user.query';
import { marketConfigQueryOptions } from '~/domains/market/queries/config.query';
import { getIpData } from '~/domains/market/queries/ip-data.query';
import type {
  RecentProductViewStorage,
  UserActivitiesSessionStorage,
} from '~/domains/market/stores/market.store.types';

const MAX_RECENT_PRODUCT_VIEWS = 24;

const COUNTRY_TO_MARKET_MAP: Record<string, string> = {
  'United States of America': 'United States',
  USA: 'United States',
  US: 'United States',
  VN: 'Vietnam',
};

function resolveSupportedMarket(countryName: string | undefined, enabledMarkets: MarketConfigMarket[]) {
  if (!countryName) {
    return undefined;
  }

  return enabledMarkets.find(market => market.name === countryName) ??
    enabledMarkets.find(market => market.name === COUNTRY_TO_MARKET_MAP[countryName]);
}

type BaseMarket = Omit<MarketConfigMarket, 'preview_country_code'>;

function resolveMarketCurrency(
  currencyCode: string | undefined,
  market: Pick<BaseMarket, 'defaultCurrency' | 'supportedCurrencies'>,
): MarketCurrencies {
  if (currencyCode && market.supportedCurrencies.includes(currencyCode as MarketCurrencies)) {
    return currencyCode as MarketCurrencies;
  }

  return market.defaultCurrency;
}

function getBaseMarket(): BaseMarket {
  return {
    code: 'US',
    name: MARKET_CONFIG.BASE_REGION,
    defaultCurrency: MARKET_CONFIG.BASE_CURRENCY,
    supportedCurrencies: [MARKET_CONFIG.BASE_CURRENCY],
    defaultLocale: 'en-US',
    supportedLocales: ['en-US'],
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

  const userActivities = useStorage<Partial<UserActivitiesSessionStorage>>(
    SessionStorageKeys.USER_ACTIVITIES,
    readStoredObject<UserActivitiesSessionStorage>(
      sessionStorageRef,
      SessionStorageKeys.USER_ACTIVITIES,
    ) || {},
    sessionStorageRef,
  );

  const recentProductViews = useStorage<RecentProductViewStorage[]>(
    LocalStorageKeys.RECENT_PRODUCT_VIEWS,
    readStoredObject<RecentProductViewStorage[]>(
      localStorageRef,
      LocalStorageKeys.RECENT_PRODUCT_VIEWS,
    ) || [],
    localStorageRef,
    {
      serializer: StorageSerializers.object,
    },
  );

  const guestPreferencesCookie = useCookie<AuthPreferences | null>(
    GUEST_PREFERENCES_COOKIE_KEY,
    {
      default: () => null,
      sameSite: 'lax',
    },
  );

  const persistedGuestPreferences = sanitizeMarketPreferences(
    import.meta.client
      ? readStoredObject<AuthPreferences>(
        localStorageRef,
        LocalStorageKeys.GUEST_PREFERENCES,
      ) ?? guestPreferencesCookie.value
      : guestPreferencesCookie.value,
  );

  const guestPreferences = useStorage<AuthPreferences | null>(
    LocalStorageKeys.GUEST_PREFERENCES,
    persistedGuestPreferences,
    localStorageRef,
    {
      serializer: StorageSerializers.object,
    },
  );

  // `useStorage` hydrates the raw localStorage value after setup, which bypasses
  // the sanitisation above. Normalise once so retired language codes migrate to
  // English while the stored region and currency survive.
  const hydratedGuestPreferences = sanitizeMarketPreferences(guestPreferences.value);
  if (
    hydratedGuestPreferences
    && hydratedGuestPreferences.language !== guestPreferences.value?.language
  ) {
    guestPreferences.value = hydratedGuestPreferences;
  }

  const marketPreferenceSource = ref<MarketPreferenceSource | null>(null);
  const isMarketReady = ref(false);
  const marketReadyPromise = shallowRef<Promise<void> | null>(null);
  const marketConfig = shallowRef<MarketConfigResponse | null>(null);
  let marketConfigPromise: Promise<MarketConfigResponse | undefined> | null = null;

  async function ensureMarketConfig() {
    if (marketConfig.value) {
      return marketConfig.value;
    }

    marketConfigPromise ??= queryClient
      .query(marketConfigQueryOptions)
      .catch(() => undefined);

    const config = await marketConfigPromise;
    marketConfigPromise = null;
    marketConfig.value = config ?? null;

    return config;
  }

  // ISR routes are cached together with their response headers, so a Set-Cookie
  // written during SSR is replayed from the shared CDN cache to every visitor
  // and resets their guest preferences. Persist only from the client; the
  // server still reads the cookie for the initial render.
  const persistGuestPreferencesCookie = (preferences: AuthPreferences | null) => {
    if (import.meta.client) {
      guestPreferencesCookie.value = preferences;
    }
  };

  const activePreferences = computed(() => {
    return dataUserAuth.value?.user?.preferences ?? guestPreferences.value ?? null;
  });

  const previewCountryCode = computed(() => resolvePreviewCountryCode(
    marketConfig.value?.markets,
    activePreferences.value?.region,
  ));

  const markMarketReady = (
    preferences: AuthPreferences,
    source: MarketPreferenceSource,
  ) => {
    guestPreferences.value = preferences;
    persistGuestPreferencesCookie(preferences);
    marketPreferenceSource.value = source;
    isMarketReady.value = true;
  };

  // sync with LS
  watch(() => dataUserAuth.value?.user, () => {
    if (dataUserAuth.value?.user?.preferences) {
      void ensureMarketConfig();
      markMarketReady(dataUserAuth.value.user.preferences, 'user_preferences');
      return;
    }

    if (guestPreferences.value) {
      void ensureMarketConfig();
      marketPreferenceSource.value ??= 'guest_preferences';
      isMarketReady.value = true;
    }
  });

  async function ensureMarketReady() {
    if (dataUserAuth.value?.user?.preferences) {
      await ensureMarketConfig();
      markMarketReady(dataUserAuth.value.user.preferences, 'user_preferences');
      return;
    }

    if (guestPreferences.value) {
      await ensureMarketConfig();
      marketPreferenceSource.value ??= 'guest_preferences';
      isMarketReady.value = true;
      return;
    }

    if (marketReadyPromise.value) {
      await marketReadyPromise.value;
      return;
    }

    marketReadyPromise.value = (async () => {
      const [currentUser, ipData, config] = await Promise.all([
        queryClient.query({ ...currentUserQueryOptions, staleTime: 'static' }).catch(() => undefined),
        getIpData().catch(() => undefined),
        ensureMarketConfig(),
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

      const enabledMarkets = config?.markets.filter(market => market.enabled) ?? [];
      const market = resolveSupportedMarket(
        (ipData as IpDataResponse).country_name,
        enabledMarkets,
      ) ?? getBaseMarket();

      // Market detection may seed the region and currency, never the
      // Storefront Language: the URL decides the UI language, and a first
      // visit without an explicit preference is always English.
      markMarketReady({
        currency: resolveMarketCurrency((ipData as IpDataResponse).currency?.code, market),
        language: MARKET_CONFIG.BASE_LANGUAGE,
        region: market.name,
      }, config ? 'ip_lookup' : 'fallback');
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
    persistGuestPreferencesCookie(sanitizeMarketPreferences(preferences));
  }, { deep: true });

  const clearCategoryRecommendationState = () => {
    userActivities.value = {
      ...userActivities.value,
      categoryIdProductVisited: undefined,
      rootCategoryProductVisited: undefined,
      subCategoriesLastVisit: undefined,
    };
  };

  const recordRecentProductView = (product: RecentProductViewStorage['product']) => {
    const nextEntry: RecentProductViewStorage = {
      product,
      viewedAt: new Date().toISOString(),
    };
    const dedupedEntries = recentProductViews.value.filter(
      entry => entry.product.id !== product.id,
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
    activePreferences,
    marketPreferenceSource,
    marketConfig,
    previewCountryCode,
    isMarketReady,
    marketReadyPromise,
    ensureMarketReady,
    ensureMarketConfig,
    clearCategoryRecommendationState,
    recordRecentProductView,
    clearRecentProductViews,
  };
});
