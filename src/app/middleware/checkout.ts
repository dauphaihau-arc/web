import { ROUTES } from '~/shared/config/enums/routes';
import type { Cart } from '~/shared/types/cart';

export default defineNuxtRouteMiddleware((to) => {
  const cartId = to.query['c'] as Cart['id'];
  if (!cartId) {
    return navigateTo(ROUTES.HOME);
  }
});
