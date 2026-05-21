import type { Cart } from '~/shared/models/cart';
import { routes } from '~/shared/navigation/routes';

export default defineNuxtRouteMiddleware((to) => {
  const cartId = to.query['c'] as Cart['id'];
  if (!cartId) {
    return navigateTo(routes.home());
  }
});
