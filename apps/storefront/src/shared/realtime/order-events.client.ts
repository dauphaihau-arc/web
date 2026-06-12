import type { QueryClient } from '@tanstack/vue-query';
import type { OrderUpdatedRealtimeEvent } from './order-events';
import { mergeOrderShopWithLiveUpdate, useOrderLiveUpdates } from './order-live-updates';
import type { GetMyOrderDetailResponse, GetOrderShopsResponse } from '~/shared/api/me/order/contracts/order.contract';

type OrderEventsClient = {
  start: () => void
  stop: () => void
};

type GlobalOrderEventsState = {
  eventSource: EventSource | null
  handleMessage: ((rawPayload: string) => Promise<void>) | null
};

const ORDER_EVENTS_STATE_KEY = '__storefrontOrderEventsState__';

function buildEventsUrl(): string {
  const config = useRuntimeConfig();
  return `${config.public.apiBaseURL}/v${config.public.apiVersion}/me/events`;
}

function getGlobalOrderEventsState(): GlobalOrderEventsState {
  const globalState = globalThis as typeof globalThis & Record<string, GlobalOrderEventsState | undefined>;

  if (!globalState[ORDER_EVENTS_STATE_KEY]) {
    globalState[ORDER_EVENTS_STATE_KEY] = {
      eventSource: null,
      handleMessage: null,
    };
  }

  return globalState[ORDER_EVENTS_STATE_KEY]!;
}

function isOrderUpdatedRealtimeEvent(value: unknown): value is OrderUpdatedRealtimeEvent {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return typeof Reflect.get(value, 'orderId') === 'string';
}

function patchOrderShopsCache(
  queryClient: QueryClient,
  payload: OrderUpdatedRealtimeEvent
): void {
  const cacheEntries = queryClient.getQueriesData<Pick<GetOrderShopsResponse, 'order_shops'>>({
    queryKey: ['get-order-shops'],
  });

  for (const [queryKey, queryData] of cacheEntries) {
    if (!queryData?.order_shops) {
      continue;
    }

    queryClient.setQueryData(queryKey, {
      ...queryData,
      order_shops: queryData.order_shops.map(orderShop =>
        orderShop.id === payload.orderId ?
          mergeOrderShopWithLiveUpdate(orderShop, payload) :
          orderShop
      ),
    });
  }
}

function patchOrderDetailCache(
  queryClient: QueryClient,
  payload: OrderUpdatedRealtimeEvent
): void {
  queryClient.setQueryData<Pick<GetMyOrderDetailResponse, 'order_shop'>>(['get-order-by-id', payload.orderId], (current) => {
    if (!current?.order_shop) {
      return current;
    }

    return {
      ...current,
      order_shop: mergeOrderShopWithLiveUpdate(current.order_shop, payload),
    };
  });
}

async function handleOrderUpdated(
  queryClient: QueryClient,
  payload: OrderUpdatedRealtimeEvent
): Promise<void> {
  useOrderLiveUpdates().applyUpdate(payload);
  patchOrderShopsCache(queryClient, payload);
  patchOrderDetailCache(queryClient, payload);

  await queryClient.invalidateQueries({ queryKey: ['get-order-shops'] });
  await queryClient.invalidateQueries({ queryKey: ['get-order-by-id', payload.orderId] });

  await queryClient.refetchQueries({
    queryKey: ['get-order-shops'],
    type: 'active',
  });
  await queryClient.refetchQueries({
    queryKey: ['get-order-by-id', payload.orderId],
    type: 'active',
    exact: true,
  });
}

async function handleIncomingMessage(
  queryClient: QueryClient,
  rawPayload: string
): Promise<void> {
  const payload = JSON.parse(rawPayload) as unknown;

  if (!isOrderUpdatedRealtimeEvent(payload)) {
    return;
  }

  await handleOrderUpdated(queryClient, payload);
}

export function createOrderEventsClient(queryClient: QueryClient): OrderEventsClient {
  const state = getGlobalOrderEventsState();

  return {
    start() {
      state.handleMessage = (rawPayload: string) => handleIncomingMessage(queryClient, rawPayload);

      if (state.eventSource) {
        return;
      }

      const eventSource = new EventSource(buildEventsUrl(), { withCredentials: true });

      eventSource.addEventListener('order.updated', (event) => {
        void state.handleMessage?.(event.data);
      });
      eventSource.onmessage = (event) => {
        void state.handleMessage?.(event.data);
      };
      eventSource.onerror = () => {
        console.warn('Order events SSE connection disconnected');
      };

      state.eventSource = eventSource;
    },
    stop() {
      state.eventSource?.close();
      state.eventSource = null;
      state.handleMessage = null;
    },
  };
}
