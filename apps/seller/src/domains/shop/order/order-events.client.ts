import type { QueryClient } from '@tanstack/vue-query';

export type ShopOrderUpdatedSsePayload = {
  eventType?: string
  orderId?: string
  changed?: string[]
};

/**
 * Keeps the seller's open order pages live: a carrier handover or delivery the
 * buyer sees also reaches the seller over the same `me/events` stream.
 */
export function createOrderEventsClient(queryClient: QueryClient) {
  if (!import.meta.client) {
    return null;
  }

  const config = useRuntimeConfig();

  // Server-sent events stay off the Nitro proxy to avoid serverless stream time limits.
  const baseUrl = `${config.public.apiOrigin.replace(/\/+$/, '')}/v${config.public.apiVersion}`;

  const eventSource = new EventSource(`${baseUrl}/me/events`, {
    withCredentials: true,
  });

  eventSource.addEventListener('message', (event) => {
    let payload: ShopOrderUpdatedSsePayload;

    try {
      payload = JSON.parse(event.data) as ShopOrderUpdatedSsePayload;
    }
    catch {
      // Ignore malformed event payloads from unrelated event producers.
      return;
    }

    if (payload.eventType !== 'order.updated' || typeof payload.orderId !== 'string') {
      return;
    }

    void queryClient.invalidateQueries({ queryKey: ['shop-order-detail', payload.orderId] });
    void queryClient.invalidateQueries({ queryKey: ['shop-orders'] });
  });

  return {
    close: () => eventSource.close(),
  };
}
