import type { ComputedRef } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import type { AppIconAlias } from '@arc/ui/foundation/app-icon.constants';
import { useLocalizedRoute } from '~/shared/composables/use-localized-route';
import { routes } from './routes';

export type AppNavigationItem = {
  label: string
  icon?: AppIconAlias | string
  to: RouteLocationRaw
  disabled?: boolean
};

/**
 * Account navigation targets, localized to the active URL locale.
 *
 * A composable rather than a constant because both the targets and the labels
 * follow the active locale.
 */
export function useAccountSidebarLinks(): ComputedRef<AppNavigationItem[]> {
  const { localizePath } = useLocalizedRoute();
  const { t: translate } = useI18n();

  return computed(() => [
    {
      label: translate('header.account.nav.account'),
      icon: 'account',
      to: localizePath(routes.account()),
    },
    {
      label: translate('header.account.nav.addresses'),
      icon: 'location',
      to: localizePath(routes.accountAddresses()),
    },
    // {
    //   label: 'Summary',
    //   disabled: true,
    //   icon: 'i-heroicons-credit-card',
    //   to: localizePath(routes.home()),
    // },
    // {
    //   label: 'Privacy',
    //   disabled: true,
    //   icon: 'i-heroicons-shield-check',
    //   to: localizePath(routes.home()),
    // },
    // {
    //   label: 'Preferences',
    //   disabled: true,
    //   icon: 'i-heroicons-cog',
    //   to: localizePath(routes.home()),
    // },
  ]);
}
