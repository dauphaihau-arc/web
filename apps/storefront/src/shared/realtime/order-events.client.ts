import type { QueryClient } from '@tanstack/vue-query'
import type { OrderUpdatedRealtimeEvent } from './order-events'
import { useOrderLiveUpdates } from './order-live-updates'

type OrderEventsClient = {
  start: () => void
  stop: () => void
}

function buildEventsUrl(): string {
  const config = useRuntimeConfig()
  return `${config.public.apiBaseURL}/v${config.public.apiVersion}/me/events`
}

function isOrderUpdatedRealtimeEvent(value: unknown): value is OrderUpdatedRealtimeEvent {
  if (!value || typeof value !== 'object') {
    return false
  }

  return typeof Reflect.get(value, 'orderId') === 'string'
}

function patchOrderShopsCache(
  queryClient: QueryClient,
  payload: OrderUpdatedRealtimeEvent,
): void {
  const cacheEntries = queryClient.getQueriesData<{ order_shops?: Array<Record<string, unknown>> }>({
    queryKey: ['get-order-shops'],
  })

  for (const [queryKey, queryData] of cacheEntries) {
    if (!queryData?.order_shops) {
      continue
    }

    queryClient.setQueryData(queryKey, {
      ...queryData,
      order_shops: queryData.order_shops.map((orderShop) => {
        if (orderShop.id !== payload.orderId) {
          return orderShop
        }

        const shipping = (orderShop.shipping ?? {}) as Record<string, unknown>

        return {
          ...orderShop,
          ...(payload.status ? { status: payload.status } : {}),
          shipping: {
            ...shipping,
            ...(payload.shippingStatus
              ? { shipping_status: payload.shippingStatus }
              : {}),
            updated_at: payload.occurredAt,
          },
        }
      }),
    })
  }
}

function patchOrderDetailCache(
  queryClient: QueryClient,
  payload: OrderUpdatedRealtimeEvent,
): void {
  queryClient.setQueryData<{
    order_shop?: Record<string, unknown>
  }>(['get-order-by-id', payload.orderId], (current) => {
    if (!current?.order_shop) {
      return current
    }

    const shipping = (current.order_shop.shipping ?? {}) as Record<string, unknown>

    return {
      ...current,
      order_shop: {
        ...current.order_shop,
        ...(payload.status ? { status: payload.status } : {}),
        shipping: {
          ...shipping,
          ...(payload.shippingStatus
            ? { shipping_status: payload.shippingStatus }
            : {}),
          updated_at: payload.occurredAt,
        },
      },
    }
  })
}

async function handleOrderUpdated(
  queryClient: QueryClient,
  payload: OrderUpdatedRealtimeEvent,
): Promise<void> {
  useOrderLiveUpdates().applyUpdate(payload)
  patchOrderShopsCache(queryClient, payload)
  patchOrderDetailCache(queryClient, payload)

  await queryClient.invalidateQueries({ queryKey: ['get-order-shops'] })
  await queryClient.invalidateQueries({ queryKey: ['get-order-by-id', payload.orderId] })

  await queryClient.refetchQueries({
    queryKey: ['get-order-shops'],
    type: 'active',
  })
  await queryClient.refetchQueries({
    queryKey: ['get-order-by-id', payload.orderId],
    type: 'active',
    exact: true,
  })
}

async function handleIncomingMessage(
  queryClient: QueryClient,
  rawPayload: string,
): Promise<void> {
  const payload = JSON.parse(rawPayload) as unknown

  if (!isOrderUpdatedRealtimeEvent(payload)) {
    return
  }

  await handleOrderUpdated(queryClient, payload)
}

export function createOrderEventsClient(queryClient: QueryClient): OrderEventsClient {
  let eventSource: EventSource | null = null

  return {
    start() {
      if (eventSource) {
        return
      }

      eventSource = new EventSource(buildEventsUrl(), { withCredentials: true })
      eventSource.addEventListener('order.updated', (event) => {
        void handleIncomingMessage(queryClient, event.data)
      })
      eventSource.onmessage = (event) => {
        void handleIncomingMessage(queryClient, event.data)
      }
    },
    stop() {
      eventSource?.close()
      eventSource = null
    },
  }
}
