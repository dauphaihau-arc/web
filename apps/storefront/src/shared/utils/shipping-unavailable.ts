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

/**
 * The recovery kind for a preview that cannot price shipping, or `null` when
 * the preview is absent, digital, or already available. Callers use this to
 * decide whether a buyer-facing recovery action belongs on the surface.
 */
export function resolveShippingPreviewKind(
  preview: {
    available: boolean
    // eslint-disable-next-line @typescript-eslint/naming-convention -- API preview fields are snake_case.
    is_digital: boolean
    reason?: string | null
  } | null | undefined,
): ShippingUnavailableKind | null {
  if (!preview || preview.is_digital || preview.available) {
    return null;
  }

  return resolveShippingUnavailableKind(preview.reason);
}
