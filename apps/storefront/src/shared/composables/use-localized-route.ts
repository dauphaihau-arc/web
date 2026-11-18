import type { RouteLocationRaw } from 'vue-router';

/**
 * Single entry point for locale-aware navigation.
 *
 * Route paths in `~/shared/navigation` are language-neutral (`/`, `/cart`, ...);
 * every link or redirect rendered to a buyer goes through `localizePath` so it
 * picks up the active URL locale (`/vi/**` for Vietnamese, unprefixed for
 * English). Prefixing the resolved path keeps query strings and hashes intact
 * without depending on the i18n module's route-name resolution for dynamic
 * category and product routes.
 *
 * Reads `$i18n` from the Nuxt app rather than `useI18n()` so route middleware
 * and plugins can localize redirects outside a component setup scope.
 */
export function useLocalizedRoute() {
  const router = useRouter();
  const nuxtApp = useNuxtApp();
  const i18n = nuxtApp.$i18n as {
    locale?: { value?: string }
    defaultLocale?: string
  } | undefined;
  const defaultLocale = i18n?.defaultLocale ?? 'en';

  function localizePath(target: RouteLocationRaw): string {
    const locale = i18n?.locale?.value ?? defaultLocale;
    const prefix = `/${locale}`;
    const resolved = router.resolve(target);

    const alreadyLocalized = locale !== defaultLocale
      && (resolved.path === prefix || resolved.path.startsWith(`${prefix}/`));

    if (locale === defaultLocale || alreadyLocalized) {
      return resolved.fullPath;
    }

    return `${prefix}${resolved.fullPath}`;
  }

  return {
    localizePath,
  };
}
