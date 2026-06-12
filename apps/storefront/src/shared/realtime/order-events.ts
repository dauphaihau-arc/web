export type OrderUpdatedRealtimeEvent = {
  orderId: string
  changed: string[]
  status?: string
  shippingStatus?: string
  occurredAt: string
};
