import { StorefrontLanguages } from '@arc/enums/market';
import { routePaths } from '~/shared/navigation/routes';

/**
 * The bare root is the only URL where a persisted Buyer Language Preference may
 * choose the rendering locale. An explicit `/vi/**` URL always wins, and the
 * server never redirects: this plugin exists only on the client.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const route = useRoute();
  const marketStore = useMarketStore();
  const switchLocalePath = useSwitchLocalePath();

  async function redirectRootToVietnamese() {
    if (route.fullPath !== routePaths.home) {
      return;
    }

    try {
      await marketStore.ensureMarketReady();
    }
    catch {
      return;
    }

    if (marketStore.activePreferences?.language !== StorefrontLanguages.VI) {
      return;
    }

    const path = switchLocalePath('vi');

    if (path) {
      await navigateTo(path, { replace: true });
    }
  }

  nuxtApp.hook('app:mounted', () => {
    void redirectRootToVietnamese();
  });

  // Client-side navigation can return to `/` after the app has mounted.
  watch(
    () => route.fullPath,
    () => {
      void redirectRootToVietnamese();
    },
  );
});
