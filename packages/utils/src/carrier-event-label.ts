const CARRIER_EVENT_LABELS: Record<string, string> = {
  LABEL_CREATED: 'Label created',
  PICKED_UP: 'Picked up',
  IN_TRANSIT: 'In transit',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  DELIVERY_FAILED: 'Delivery failed',
  RETURNED: 'Returned to sender',
}

/**
 * Readable wording for a carrier scan code, shared by the apps that render a
 * Shipment's tracking events. Codes arrive in any case; unknown or absent
 * codes return `undefined` so each surface keeps its own fallback wording.
 */
export function carrierEventLabel(eventCode?: string | null): string | undefined {
  const code = eventCode?.trim().toUpperCase()

  return code ? CARRIER_EVENT_LABELS[code] : undefined
}
