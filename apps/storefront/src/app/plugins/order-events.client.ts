import { useGetCurrentUser } from '~/domains/me/queries/current-user.query';
import { createOrderEventsClient } from '~/domains/me/realtime/order-events.client';

/** Routes whose data the live order stream patches; other pages never open it. */
const ORDER_ROUTE_PREFIXES = ['/orders', '/guest-orders'] as const;

export default defineNuxtPlugin(() => {
  const currentUserQuery = useGetCurrentUser();
  const queryClient = useQueryClient();
  const orderEventsClient = createOrderEventsClient(queryClient);
  const route = useRoute();

  // One stream per tab consumes one of the browser's six connections per origin.
  // Opening it on the catalog would starve ordinary requests once several tabs
  // are open, so only order views, where the stream actually patches data, hold it.
  watch(
    [
      () => currentUserQuery.data.value?.user?.id,
      () => isOrderRoute(route.path),
    ],
    ([userId, onOrderRoute]) => {
      if (!userId || !onOrderRoute) {
        orderEventsClient.stop();
        return;
      }

      orderEventsClient.start();
    },
    { immediate: true },
  );
});

function isOrderRoute(path: string): boolean {
  return ORDER_ROUTE_PREFIXES.some(
    prefix => path === prefix || path.startsWith(`${prefix}/`),
  );
}
