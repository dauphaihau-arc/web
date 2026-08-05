export const exportOrderColumns = [
  { id: 'id', label: 'ID', default: true },
  { id: 'order_number', label: 'Order number', default: true },
  { id: 'created_at', label: 'Created date (UTC)', default: true },
  { id: 'customer_email', label: 'Customer email', default: true },
  { id: 'customer_full_name', label: 'Customer full name', default: true },
  { id: 'status', label: 'Status', default: true },
  { id: 'payment_type', label: 'Payment type', default: true },
  { id: 'refund_status', label: 'Refund status', default: true },
  { id: 'refunded_at', label: 'Refunded date (UTC)', default: true },
  { id: 'currency', label: 'Currency', default: true },
  { id: 'subtotal_minor', label: 'Subtotal minor', default: true },
  { id: 'shipping_minor', label: 'Shipping minor', default: true },
  { id: 'discount_minor', label: 'Discount minor', default: true },
  { id: 'total_minor', label: 'Total minor', default: true },
  { id: 'promo_codes', label: 'Promo codes', default: true },
  { id: 'shipping_status', label: 'Shipping status', default: true },
  { id: 'shipping_to_country', label: 'Shipping to country', default: true },
  { id: 'shipping_from_countries', label: 'Shipping from countries', default: true },
  { id: 'tracking_number', label: 'Tracking number', default: true },
  { id: 'shipping_carrier', label: 'Shipping carrier', default: true },
  { id: 'canceled_at', label: 'Canceled date (UTC)', default: true },
  { id: 'cancel_reason', label: 'Cancel reason', default: true },
  { id: 'note', label: 'Seller note', default: true },
  { id: 'customer_support_note', label: 'Customer support note', default: false },
  { id: 'shipment_note', label: 'Shipment note', default: false },
  { id: 'shop_id', label: 'Shop ID', default: false },
  { id: 'shop_name', label: 'Shop name', default: false },
] as const;

export const defaultExportColumnIds = exportOrderColumns
  .filter(column => column.default)
  .map(column => column.id);

export const exportColumnPresetOptions = [
  { id: 'default', label: `Default (${defaultExportColumnIds.length})` },
  { id: 'custom', label: 'Custom' },
];
