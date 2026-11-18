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
  const { $i18n } = useNuxtApp();

  function localizePath(target: RouteLocationRaw): string {
    const locale = $i18n.locale.value;
    const prefix = `/${locale}`;
    const resolved = router.resolve(target);

    const alreadyLocalized = locale !== $i18n.defaultLocale
      && (resolved.path === prefix || resolved.path.startsWith(`${prefix}/`));

    if (locale === $i18n.defaultLocale || alreadyLocalized) {
      return resolved.fullPath;
    }

    return `${prefix}${resolved.fullPath}`;
  }

  return {
    localizePath,
  };
}
