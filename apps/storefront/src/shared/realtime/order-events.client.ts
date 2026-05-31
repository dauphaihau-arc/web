import type { QueryClient } from '@tanstack/vue-query'
import type { OrderUpdatedRealtimeEvent } from './order-events'
import { useOrderLiveUpdates } from './order-live-updates'

type OrderEventsClient = {
  start: () => void
  stop: () => void
}

type GlobalOrderEventsState = {
  eventSource: EventSource | null
  handleMessage: ((rawPayload: string) => Promise<void>) | null
}

function buildEventsUrl(): string {
  const config = useRuntimeConfig()
  return `${config.public.apiBaseURL}/v${config.public.apiVersion}/me/events`
}

function getGlobalOrderEventsState(): GlobalOrderEventsState {
  const globalState = globalThis as typeof globalThis & {
    __storefrontOrderEventsState__?: GlobalOrderEventsState
  }

  if (!globalState.__storefrontOrderEventsState__) {
    globalState.__storefrontOrderEventsState__ = {
      eventSource: null,
      handleMessage: null,
    }
  }

  return globalState.__storefrontOrderEventsState__
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
  const state = getGlobalOrderEventsState()

  return {
    start() {
      state.handleMessage = (rawPayload: string) => handleIncomingMessage(queryClient, rawPayload)

      if (state.eventSource) {
        return
      }

      const eventSource = new EventSource(buildEventsUrl(), { withCredentials: true })

      eventSource.addEventListener('order.updated', (event) => {
        void state.handleMessage?.(event.data)
      })
      eventSource.onmessage = (event) => {
        void state.handleMessage?.(event.data)
      }
      eventSource.onerror = () => {
        console.warn('Order events SSE connection disconnected')
      }

      state.eventSource = eventSource
    },
    stop() {
      state.eventSource?.close()
      state.eventSource = null
      state.handleMessage = null
    },
  }
}
