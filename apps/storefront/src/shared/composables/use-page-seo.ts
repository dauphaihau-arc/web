import type { MaybeRefOrGetter } from 'vue';

export type PageSeoArea =
  | 'home'
  | 'category'
  | 'search'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'account'
  | 'orders'
  | 'auth'
  | 'messages'
  | 'success'
  | 'guestOrders';

export type PageSeoOptions = {
  /** The `seo.pages.*` copy block for the route. */
  area: PageSeoArea
  /**
   * Already-translated title, typically containing data the route had to load
   * (a product or category name). When empty the area fallback key is used.
   */
  title?: MaybeRefOrGetter<string | undefined>
  /** Already-translated description with route-specific data. */
  description?: MaybeRefOrGetter<string | undefined>
  /**
   * Locale-aware canonical path for routes whose canonical URL is not the
   * current path (the category resolver owns its own slug). May include the
   * `/vi` prefix; this composable keeps it.
   */
  canonicalPath?: MaybeRefOrGetter<string | undefined>
};

const DEFAULT_LOCALE = 'en';
const SUPPORTED_LOCALES = ['en', 'vi'] as const;

/**
 * The single head contract for storefront pages.
 *
 * Emits a translated title, description, a self-referencing canonical that
 * keeps the active locale prefix, and language-level `hreflang` alternates with
 * absolute URLs. The canonical and alternates are derived from the same path so
 * an English page can never claim the Vietnamese URL as canonical (or the other
 * way around).
 *
 * The site origin is `NUXT_PUBLIC_SITE_URL` when configured; otherwise it falls
 * back to the request origin, which keeps previews and the SSR e2e suite on the
 * URL the buyer actually used.
 */
export function usePageSeo(options: PageSeoOptions) {
  const { t, te, locale } = useI18n();
  const { $i18n } = useNuxtApp();
  const route = useRoute();
  const runtimeConfig = useRuntimeConfig();
  const requestUrl = useRequestURL();

  // `defaultLocale` lives on the i18n instance, not the vue-i18n composition
  // API. Fall back to the storefront default if the module has not exposed it.
  const configuredDefaultLocale = $i18n.defaultLocale || DEFAULT_LOCALE;

  const activeLocale = computed(() => locale.value || configuredDefaultLocale);
  const localePrefix = computed(() => (
    activeLocale.value === configuredDefaultLocale ? '' : `/${activeLocale.value}`
  ));

  const siteOrigin = computed(() => {
    const configured = (runtimeConfig.public.siteUrl as string | undefined)?.trim();
    const origin = configured || requestUrl.origin;

    return origin.replace(/\/+$/, '');
  });

  function normalizePath(path: string | undefined): string {
    if (!path) {
      return '/';
    }

    const [pathname] = path.split(/[?#]/);
    const withLeadingSlash = pathname?.startsWith('/') ? pathname : `/${pathname ?? ''}`;

    return withLeadingSlash.length > 1
      ? withLeadingSlash.replace(/\/+$/, '')
      : '/';
  }

  /** Add the current locale prefix to a language-neutral path. */
  function localizePath(path: string): string {
    if (!localePrefix.value) {
      return path;
    }

    if (path === localePrefix.value || path.startsWith(`${localePrefix.value}/`)) {
      return path;
    }

    return path === '/' ? localePrefix.value : `${localePrefix.value}${path}`;
  }

  /** Strip the current locale prefix so alternates can be built per locale. */
  function neutralPath(path: string): string {
    if (
      localePrefix.value
      && (path === localePrefix.value || path.startsWith(`${localePrefix.value}/`))
    ) {
      return path.slice(localePrefix.value.length) || '/';
    }

    return path;
  }

  function localizedAlternatePath(path: string, targetLocale: string): string {
    if (targetLocale === configuredDefaultLocale) {
      return path;
    }

    return path === '/' ? `/${targetLocale}` : `/${targetLocale}${path}`;
  }

  const canonicalPath = computed(() => (
    localizePath(normalizePath(toValue(options.canonicalPath) ?? route.path))
  ));

  const neutralCanonicalPath = computed(() => neutralPath(canonicalPath.value));

  const pageTitle = computed(() => {
    const provided = toValue(options.title)?.trim();

    if (provided) {
      return provided;
    }

    const fallbackKey = `seo.pages.${options.area}.titleFallback`;

    return te(fallbackKey)
      ? t(fallbackKey)
      : t(`seo.pages.${options.area}.title`);
  });

  const pageDescription = computed(() => {
    const provided = toValue(options.description)?.trim();

    if (provided) {
      return provided;
    }

    const fallbackKey = `seo.pages.${options.area}.descriptionFallback`;

    return te(fallbackKey)
      ? t(fallbackKey)
      : t(`seo.pages.${options.area}.description`);
  });

  const alternates = computed(() => SUPPORTED_LOCALES.map((targetLocale) => {
    const path = localizedAlternatePath(neutralCanonicalPath.value, targetLocale);

    return {
      rel: 'alternate' as const,
      hreflang: targetLocale,
      href: `${siteOrigin.value}${path}`,
    };
  }));

  // `x-default` points at English because `/` is the default locale and the
  // URL the storefront's canonical entry point uses.
  const defaultAlternate = computed(() => ({
    rel: 'alternate' as const,
    hreflang: 'x-default',
    href: `${siteOrigin.value}${localizedAlternatePath(neutralCanonicalPath.value, DEFAULT_LOCALE)}`,
  }));

  useHead(() => ({
    title: pageTitle.value,
    meta: [
      { name: 'description', content: pageDescription.value },
    ],
    link: [
      { rel: 'canonical', href: canonicalPath.value },
      ...alternates.value,
      defaultAlternate.value,
    ],
  }));

  return {
    canonicalPath,
    alternates,
  };
}
