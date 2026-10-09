type ShippingProfileApiError = {
  code?: string
  message?: string
  assignedProductCount?: number
};

function readStringField(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return typeof value === 'string' ? value : undefined;
}

function readNumberField(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return typeof value === 'number' ? value : undefined;
}

/**
 * Shop shipping-profile endpoints reject with the same envelope either bare or
 * wrapped by `$fetch` in `response._data`, so callers unwrap once instead of
 * re-typing the envelope at every call site. Endpoint-specific context (`code`,
 * `assigned_product_count`) sits under `details`.
 */
export function readShippingProfileApiError(error: unknown): ShippingProfileApiError {
  const value = error as {
    data?: Record<string, unknown>
    response?: Record<string, unknown>
  };
  const payload = (value.response?.['_data'] ?? value.data ?? error) as Record<string, unknown>;
  const details = payload.details && typeof payload.details === 'object'
    ? payload.details as Record<string, unknown>
    : {};

  return {
    code: readStringField(payload, 'code'),
    message: readStringField(payload, 'message'),
    assignedProductCount: readNumberField(details, 'assigned_product_count'),
  };
}
