import { ShippingPreviewUnavailableReasons } from '@arc/enums';

/**
 * The buyer-facing bucket for an unavailable shipping preview. Internal
 * seller/configuration reasons collapse into one bucket so the storefront
 * never explains seller configuration to a buyer.
 */
export type ShippingUnavailableKind = 'destination' | 'currency' | 'unavailable';

export function resolveShippingUnavailableKind(
  reason: string | null | undefined,
): ShippingUnavailableKind {
  switch (reason) {
    case ShippingPreviewUnavailableReasons.UNSUPPORTED_DESTINATION:
      return 'destination';
    case ShippingPreviewUnavailableReasons.UNSUPPORTED_CURRENCY:
      return 'currency';
    case ShippingPreviewUnavailableReasons.MISSING_ASSIGNMENT:
    case ShippingPreviewUnavailableReasons.PROFILE_NOT_FOUND:
    case ShippingPreviewUnavailableReasons.PROFILE_NOT_READY:
    default:
      return 'unavailable';
  }
}
