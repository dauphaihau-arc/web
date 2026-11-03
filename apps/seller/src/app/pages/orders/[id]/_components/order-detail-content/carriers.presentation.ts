import type { Carrier } from '~/domains/shop/api/carrier/contracts/carrier.contract';

export type CarrierOption = {
  label: string
  value: string
};

export function carrierOptions(carriers: Carrier[]): CarrierOption[] {
  return carriers.map(carrier => ({
    label: carrier.name,
    value: carrier.code,
  }));
}

export function findCarrier(
  carriers: Carrier[],
  code: string | undefined,
): Carrier | undefined {
  if (!code) return undefined;
  return carriers.find(carrier => carrier.code === code);
}

/** The carrier's own cue for its tracking number format, e.g. `10 digits`. */
export function carrierTrackingHint(carrier: Carrier | undefined): string {
  return carrier?.tracking_hint ?? '';
}

/**
 * Example tracking numbers per carrier code, kept beside the hint so the input
 * placeholder never restates the format sentence.
 */
const TRACKING_PLACEHOLDERS: Record<string, string> = {
  usps: '9400111899223197428490',
  dhl: '1234567890',
  vnpost: 'EA123456789VN',
  other: 'Local courier tracking number',
};

const GENERIC_TRACKING_PLACEHOLDER = 'Local courier tracking number';

/** An example tracking number to show in the empty tracking-number input. */
export function carrierTrackingPlaceholder(carrier: Carrier | undefined): string {
  if (!carrier) {
    return 'Select a carrier first';
  }

  return TRACKING_PLACEHOLDERS[carrier.code] ?? GENERIC_TRACKING_PLACEHOLDER;
}

/**
 * Mirror the server rule before submitting: an observable carrier only accepts
 * a tracking number matching its catalogue pattern. Non-observable carriers and
 * an empty carrier/tracking pair are not pattern-checked.
 */
export function carrierTrackingError(
  carrier: Carrier | undefined,
  trackingNumber: string | undefined,
): string | undefined {
  const tracking = trackingNumber?.trim() ?? '';

  if (!carrier || !tracking || !carrier.observable || !carrier.tracking_pattern) {
    return undefined;
  }

  try {
    if (new RegExp(carrier.tracking_pattern).test(tracking)) {
      return undefined;
    }
  }
  catch {
    // A malformed server pattern must not block a seller from preparing.
    return undefined;
  }

  return carrier.tracking_hint
    ? `That is not a ${carrier.name} tracking number. Expected ${carrier.tracking_hint}.`
    : `That is not a ${carrier.name} tracking number.`;
}
