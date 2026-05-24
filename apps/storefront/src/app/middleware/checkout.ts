import { routes } from '~/shared/navigation/routes';

export default defineNuxtRouteMiddleware((to) => {
  const cartId = to.query['c'] as string;
  if (!cartId) {
    return navigateTo(routes.home());
  }
});
