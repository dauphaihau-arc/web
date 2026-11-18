import type { StorefrontLanguages } from '@arc/enums/market';

/**
 * Navigates to the same page, query, and hash under another URL locale.
 *
 * The preference itself is persisted by the preferences form; this composable
 * only owns the locale-aware navigation half. It prefixes the current path
 * directly instead of resolving the route through the i18n module so pages
 * excluded from SSR routing (`/account`, `/cart`, ...) also switch correctly.
 */
export function useLanguageNavigation() {
  const route = useRoute();
  const { $i18n } = useNuxtApp();

  async function navigateToLanguage(language: StorefrontLanguages) {
    const defaultLocale = $i18n.defaultLocale;
    const currentLocale = $i18n.locale.value;
    const currentPrefix = `/${currentLocale}`;
    const currentPath = route.path;

    const basePath = currentLocale !== defaultLocale
      && (currentPath === currentPrefix || currentPath.startsWith(`${currentPrefix}/`))
      ? currentPath.slice(currentPrefix.length) || '/'
      : currentPath;

    const path = language === defaultLocale
      ? basePath
      : `/${language}${basePath === '/' ? '' : basePath}`;

    await navigateTo({
      path,
      query: route.query,
      hash: route.hash,
    }, { replace: true });

    return true;
  }

  return {
    navigateToLanguage,
  };
}
