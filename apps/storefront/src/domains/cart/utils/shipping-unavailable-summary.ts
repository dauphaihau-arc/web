import {
  resolveShippingUnavailableKind,
  type ShippingUnavailableKind,
} from '~/shared/utils/shipping-unavailable';

/**
 * One cart notice must explain every selected unavailable line. Only a single
 * buyer-actionable kind keeps its specific wording; mixed or internal reasons
 * share the generic notice.
 */
export function resolveCartShippingUnavailableKind(
  reasons: readonly (string | null | undefined)[],
): ShippingUnavailableKind {
  const kinds = new Set(reasons.map(resolveShippingUnavailableKind));

  if (kinds.size === 1) {
    const [kind] = kinds;

    if (kind) {
      return kind;
    }
  }

  return 'unavailable';
}
