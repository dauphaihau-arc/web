import { routes } from '~/shared/navigation/routes';
import { useLocalizedRoute } from '~/shared/composables/use-localized-route';

export default defineNuxtRouteMiddleware((to) => {
  const { localizePath } = useLocalizedRoute();
  const cartId = to.query['c'] as string;
  if (!cartId) {
    return navigateTo(localizePath(routes.home()));
  }
});
