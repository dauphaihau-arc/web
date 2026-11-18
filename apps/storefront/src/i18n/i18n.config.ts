import commonEn from './locales/en/common.json';
import headerEn from './locales/en/header.json';
import footerEn from './locales/en/footer.json';
import homeEn from './locales/en/home.json';
import preferencesEn from './locales/en/preferences.json';
import catalogEn from './locales/en/catalog.json';
import cartEn from './locales/en/cart.json';
import checkoutEn from './locales/en/checkout.json';
import accountEn from './locales/en/account.json';
import errorsEn from './locales/en/errors.json';
import seoEn from './locales/en/seo.json';
import commonVi from './locales/vi/common.json';
import headerVi from './locales/vi/header.json';
import footerVi from './locales/vi/footer.json';
import homeVi from './locales/vi/home.json';
import preferencesVi from './locales/vi/preferences.json';
import catalogVi from './locales/vi/catalog.json';
import cartVi from './locales/vi/cart.json';
import checkoutVi from './locales/vi/checkout.json';
import accountVi from './locales/vi/account.json';
import errorsVi from './locales/vi/errors.json';
import seoVi from './locales/vi/seo.json';

/**
 * English is the default locale and the fallback for every key. Supplying both
 * message trees through the i18n instance config keeps first paint complete and
 * gives the component test environment the same messages the browser gets from
 * the lazy loader.
 */
export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'en',
  messages: {
    en: {
      ...commonEn,
      ...headerEn,
      ...footerEn,
      ...homeEn,
      ...preferencesEn,
      ...catalogEn,
      ...cartEn,
      ...checkoutEn,
      ...accountEn,
      ...errorsEn,
      ...seoEn,
    },
    vi: {
      ...commonVi,
      ...headerVi,
      ...footerVi,
      ...homeVi,
      ...preferencesVi,
      ...catalogVi,
      ...cartVi,
      ...checkoutVi,
      ...accountVi,
      ...errorsVi,
      ...seoVi,
    },
  },
}));
