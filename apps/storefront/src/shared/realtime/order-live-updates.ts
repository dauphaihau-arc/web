import type { OrderUpdatedRealtimeEvent } from './order-events'
import type {
  GetMyOrderDetailResponse,
  GetOrderShopsResponse,
} from '~/shared/api/me/order/contracts/order.contract'

type OrderShop = GetOrderShopsResponse['order_shops'][number]
type OrderShopDetail = GetMyOrderDetailResponse['order_shop']

type LiveOrderUpdates = Record<string, OrderUpdatedRealtimeEvent>

export function useOrderLiveUpdates() {
  const updates = useState<LiveOrderUpdates>('order-live-updates', () => ({}))

  const applyUpdate = (payload: OrderUpdatedRealtimeEvent) => {
    updates.value = {
      ...updates.value,
      [payload.orderId]: payload,
    }
  }

  const getUpdate = (orderId: string) => updates.value[orderId]

  return {
    updates: readonly(updates),
    applyUpdate,
    getUpdate,
  }
}

export function mergeOrderShopWithLiveUpdate<T extends OrderShop | OrderShopDetail>(
  orderShop: T,
  update?: OrderUpdatedRealtimeEvent,
): T {
  if (!update) {
    return orderShop
  }

  return {
    ...orderShop,
    ...(update.status ? { status: update.status as T['status'] } : {}),
    shipping: {
      ...orderShop.shipping,
      ...(update.shippingStatus
        ? { shipping_status: update.shippingStatus as T['shipping']['shipping_status'] }
        : {}),
      updated_at: new Date(update.occurredAt),
      ...(update.shippingStatus === 'shipped' && !orderShop.shipping.shipped_at
        ? { shipped_at: new Date(update.occurredAt) }
        : {}),
      ...(update.shippingStatus === 'delivered'
        ? {
            delivered_at: new Date(update.occurredAt),
            shipped_at: orderShop.shipping.shipped_at ?? new Date(update.occurredAt),
          }
        : {}),
    },
  }
}
