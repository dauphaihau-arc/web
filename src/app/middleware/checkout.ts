import type { Cart } from '~/shared/types/cart';
import { routes } from '~/shared/navigation/routes';

export default defineNuxtRouteMiddleware((to) => {
  const cartId = to.query['c'] as Cart['id'];
  if (!cartId) {
    return navigateTo(routes.home());
  }
});
