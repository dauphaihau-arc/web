/** The badge tones the shared status badge understands. */
export type ShopStatusTone = 'green' | 'gray' | 'yellow' | 'red' | 'blue';

/**
 * Shop lifecycle wording. The API stores the status as a free string, so an
 * unknown state keeps its raw value rather than being hidden behind a guessed
 * label.
 */
const SHOP_STATUS_TONES: Record<string, ShopStatusTone> = {
  active: 'green',
};

export function shopStatusTone(status?: string): ShopStatusTone {
  const tone = status ? SHOP_STATUS_TONES[status] : undefined;

  return tone ?? 'gray';
}

export function formatShopStatusLabel(status?: string) {
  if (!status) {
    return '';
  }

  return status
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/** The shop's settlement currency is stored as an ISO code already. */
export function formatShopCurrency(currency?: string) {
  return (currency ?? '').toUpperCase();
}
