import type { ProductInventoryUpdatedRealtimeEvent } from './product-inventory-events'

type ProductInventoryEventsClient = {
  start: (productId: string) => void
  stop: () => void
}

function buildEventsUrl(productId: string): string {
  const config = useRuntimeConfig()
  return `${config.public.apiBaseURL}/v${config.public.apiVersion}/products/${productId}/inventory/events`
}

function isProductInventoryUpdatedRealtimeEvent(
  value: unknown,
): value is ProductInventoryUpdatedRealtimeEvent {
  if (!value || typeof value !== 'object') {
    return false
  }

  return Reflect.get(value, 'eventType') === 'product.inventory.updated'
    && typeof Reflect.get(value, 'productId') === 'string'
    && typeof Reflect.get(value, 'inventoryId') === 'string'
    && typeof Reflect.get(value, 'stock') === 'number'
}

async function handleIncomingMessage(
  onInventoryUpdated: (payload: ProductInventoryUpdatedRealtimeEvent) => void | Promise<void>,
  rawPayload: string,
): Promise<void> {
  const payload = JSON.parse(rawPayload) as unknown

  if (!isProductInventoryUpdatedRealtimeEvent(payload)) {
    return
  }

  await onInventoryUpdated(payload)
}

export function createProductInventoryEventsClient(
  onInventoryUpdated: (payload: ProductInventoryUpdatedRealtimeEvent) => void | Promise<void>,
): ProductInventoryEventsClient {
  let eventSource: EventSource | null = null
  let currentProductId: string | null = null

  return {
    start(productId: string) {
      if (eventSource && currentProductId === productId) {
        return
      }

      eventSource?.close()
      currentProductId = productId
      eventSource = new EventSource(buildEventsUrl(productId))
      eventSource.onmessage = (event) => {
        void handleIncomingMessage(onInventoryUpdated, event.data)
      }
    },
    stop() {
      eventSource?.close()
      eventSource = null
      currentProductId = null
    },
  }
}
