import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { StorageSerializers, useStorage } from '@vueuse/core';
import type { User } from '~/types/user';
import { LOCAL_STORAGE_KEYS } from '~/config/enums/local-storage-keys';
import { useGetDataByIP, useGetExchangeRates } from '~/services/market';
import { useGetCurrentUser } from '~/services/user';
import type {
  CategoriesBreadcrumbStorage, ExchangeRateStorage,
  ResponseGetDataByIP,
  UserActivitiesSessionStorage
} from '~/types/market';
import { MARKET_CONFIG, MARKET_LANGUAGES } from '~/config/enums/market';
import { SESSION_STORAGE_KEYS } from '~/config/enums/session-storage-keys';

dayjs.extend(utc);

export const useMarketStore = defineStore('market', () => {
  const { data: dataUserAuth } = useGetCurrentUser();

  const categoriesBreadcrumb = useStorage(
    SESSION_STORAGE_KEYS.CATEGORIES_BREADCRUMB,
    parseJSON<CategoriesBreadcrumbStorage[]>(sessionStorage.getItem(SESSION_STORAGE_KEYS.CATEGORIES_BREADCRUMB)) || [],
    sessionStorage // bind value with SS
  );

  const userActivities = useStorage<Partial<UserActivitiesSessionStorage>>(
    SESSION_STORAGE_KEYS.USER_ACTIVITIES,
    parseJSON<UserActivitiesSessionStorage>(
      sessionStorage.getItem(SESSION_STORAGE_KEYS.USER_ACTIVITIES)
    ) || {},
    sessionStorage // bind value with SS
  );

  const exchangeRate = useStorage<ExchangeRateStorage>(
    LOCAL_STORAGE_KEYS.EXCHANGE_RATE,
    localStorage[LOCAL_STORAGE_KEYS.EXCHANGE_RATE],
    localStorage, // bind value with LS
    {
      // specify type if defaultValue may be null | https://vueuse.org/core/useStorage/#custom-serialization
      serializer: StorageSerializers.object,
      mergeDefaults: true,
    }
  );

  const guestPreferences = useStorage<User['market_preferences']>(
    LOCAL_STORAGE_KEYS.GUEST_PREFERENCES,
    localStorage[LOCAL_STORAGE_KEYS.GUEST_PREFERENCES],
    localStorage, // bind value with LS
    {
      serializer: StorageSerializers.object,
    }
  );

  // sync with LS
  watch(() => dataUserAuth.value?.user, () => {
    if (dataUserAuth.value?.user) {
      guestPreferences.value = dataUserAuth.value.user.market_preferences;
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
    { enabled: !dataUserAuth.value?.user.market_preferences && !guestPreferences.value },
    {
      onResponse: ({ response }) => {
        if (response.status === 200) {
          const data = response._data as ResponseGetDataByIP;
          guestPreferences.value = {
            currency: data.currency.code,
            language: MARKET_LANGUAGES.EN,
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
