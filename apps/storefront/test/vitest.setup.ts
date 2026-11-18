import { config } from '@vue/test-utils';
import { QueryClient, VUE_QUERY_CLIENT } from '@tanstack/vue-query';
import { beforeAll } from 'vitest';
import { createI18n } from 'vue-i18n';
import common from '~/i18n/locales/en/common.json';
import header from '~/i18n/locales/en/header.json';
import footer from '~/i18n/locales/en/footer.json';
import home from '~/i18n/locales/en/home.json';
import preferences from '~/i18n/locales/en/preferences.json';
import catalog from '~/i18n/locales/en/catalog.json';
import cart from '~/i18n/locales/en/cart.json';
import checkout from '~/i18n/locales/en/checkout.json';
import account from '~/i18n/locales/en/account.json';

const en = {
  ...common,
  ...header,
  ...footer,
  ...home,
  ...preferences,
  ...catalog,
  ...cart,
  ...checkout,
  ...account,
};

beforeAll(() => {
  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en },
  });

  config.global.plugins = [i18n];
  config.global.provide = {
    [VUE_QUERY_CLIENT]: new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    }),
  };
});
