export type OrderUpdatedRealtimeEvent = {
  orderId: string
  changed: string[]
  status?: string
  fulfillmentStatus?: string
  occurredAt: string
};
