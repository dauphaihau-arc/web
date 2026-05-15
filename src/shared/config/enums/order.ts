export enum ORDER_STATUSES {
  CANCELED = 'canceled',
  PENDING = 'pending',
  AWAITING_PAYMENT = 'awaiting_payment',
  EXPIRED = 'expired', // expired link checkout session stripe
  PAID = 'paid',
  REFUNDED = 'refunded',
  COMPLETED = 'completed', // order has been shipped/picked up, and receipt is confirmed; user has paid
  ARCHIVED = 'archived'
}

export enum PAYMENT_TYPES {
  CASH = 'cash',
  CARD = 'card'
}

export const ORDER_CONFIG = {
  MAX_CHAR_NOTE: 10000,
  MAX_ORDER_TOTAL: 999999.99, // USD
  MAX_PROMO_COUPONS: 2,
};

export enum ORDER_SHIPPING_STATUSES {
  PRE_TRANSIT = 'pre_transit',
  IN_TRANSIT = 'in_transit',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered'
}
