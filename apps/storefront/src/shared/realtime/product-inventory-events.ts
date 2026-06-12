export type ProductInventoryUpdatedRealtimeEvent = {
  eventType: 'product.inventory.updated'
  productId: string
  inventoryId: string
  stock: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
  occurredAt: string
};
