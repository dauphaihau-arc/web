import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { StorageSerializers, useStorage } from '@vueuse/core';
import type { User } from '~/shared/models/user';
import { LocalStorageKeys } from '~/shared/config/enums/local-storage-keys';
import { useGetExchangeRates } from '~/shared/server-state/market/exchange-rates.query';
import { useGetDataByIP } from '~/shared/server-state/market/ip-data.query';
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query';
import type {
  CategoriesBreadcrumbStorage, ExchangeRateStorage,
  IpDataResponse,
  UserActivitiesSessionStorage
} from '~/shared/market/market.types';
import { MARKET_CONFIG, MarketLanguages } from '~/shared/config/enums/market';
import { SessionStorageKeys } from '~/shared/config/enums/session-storage-keys';

dayjs.extend(utc);

export const useMarketStore = defineStore('market', () => {
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

  const exchangeRate = useStorage<ExchangeRateStorage>(
    LocalStorageKeys.EXCHANGE_RATE,
    localStorage[LocalStorageKeys.EXCHANGE_RATE],
    localStorage, // bind value with LS
    {
      // specify type if defaultValue may be null | https://vueuse.org/core/useStorage/#custom-serialization
      serializer: StorageSerializers.object,
      mergeDefaults: true,
    }
  );

  const guestPreferences = useStorage<User['market_preferences']>(
    LocalStorageKeys.GUEST_PREFERENCES,
    localStorage[LocalStorageKeys.GUEST_PREFERENCES],
    localStorage, // bind value with LS
    {
      serializer: StorageSerializers.object,
    }
  );

  // sync with LS
  watch(() => dataUserAuth.value?.user, () => {
    if (dataUserAuth.value?.user?.preferences) {
      guestPreferences.value = dataUserAuth.value.user.preferences;
    }
  });

  // get & refresh rates once every 24 hours
  useGetExchangeRates(
    { enabled: !exchangeRate.value || dayjs.utc().valueOf() >= exchangeRate.value.exp },
    {
      onResponse: ({ response }) => {
        if (response.status === 200) {
          exchangeRate.value = {
            rates: response._data.rates,
            exp: response._data.time_next_update_unix * 1000,
          };
        }
      },
    }
  );

  useGetDataByIP(
    { enabled: !dataUserAuth.value?.user.preferences && !guestPreferences.value },
    {
      onResponse: ({ response }) => {
        if (response.status === 200) {
          const data = response._data as IpDataResponse;
          guestPreferences.value = {
            currency: data.currency.code,
            language: MarketLanguages.EN,
            region: data.country_name || MARKET_CONFIG.BASE_REGION,
          };
        }
      },
    }
  );

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
    exchangeRate,
    categoriesBreadcrumb,
    clearCategoryRecommendationState,
  };
});
