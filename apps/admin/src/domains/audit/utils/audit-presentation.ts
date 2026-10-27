import dayjs from 'dayjs';

/**
 * The mutations the API records and this screen can filter by. The endpoint
 * rejects unknown values, so the filter only offers these.
 */
export const ADMIN_AUDIT_ACTION_OPTIONS: Array<{ label: string, value: string }> = [
  { label: 'Order status overridden', value: 'order.status.overridden' },
  { label: 'Order refund updated', value: 'order.refund.updated' },
  { label: 'Order support note updated', value: 'order.support_note.updated' },
  { label: 'Product published', value: 'product.published' },
  { label: 'Product details updated', value: 'product.details.updated' },
  { label: 'Commission schedule recorded', value: 'finance.commission_schedule.recorded' },
  { label: 'Payout account onboarding started', value: 'finance.payout_account.onboarding_started' },
  { label: 'Payout account synced', value: 'finance.payout_account.synced' },
  { label: 'Payout settings updated', value: 'finance.payout_settings.updated' },
  { label: 'Provider fee recorded', value: 'finance.provider_fee.recorded' },
  { label: 'Settlement currency changed', value: 'finance.settlement_currency.changed' },
];

/** Entity types the trail can hold; the filter maps straight to `entity_type`. */
export const ADMIN_AUDIT_ENTITY_TYPE_OPTIONS: Array<{ label: string, value: string }> = [
  { label: 'Order', value: 'order' },
  { label: 'Product', value: 'product' },
  { label: 'Commission schedule', value: 'commission_schedule' },
  { label: 'Payout account', value: 'payout_account' },
  { label: 'Payout settings', value: 'payout_settings' },
  { label: 'Provider fee', value: 'provider_fee' },
  { label: 'Settlement currency history', value: 'settlement_currency_history' },
];

const ENTITY_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  ADMIN_AUDIT_ENTITY_TYPE_OPTIONS.map(option => [option.value, option.label] as const),
);

const FINANCE_ENTITY_TYPES: Record<string, true> = {
  commission_schedule: true,
  payout_account: true,
  payout_settings: true,
  provider_fee: true,
  settlement_currency_history: true,
};

const ACTION_PREFIX_MODULES: Record<string, string> = {
  order: 'Orders',
  product: 'Products',
  finance: 'Finance',
  auth: 'Auth',
  user: 'Users',
  role: 'Users',
  roles: 'Users',
};

/** Short verbs shown inside the Action badge; the raw code never renders. */
const ACTION_SHORT_LABELS: Record<string, string> = {
  'order.status.overridden': 'Status',
  'order.refund.updated': 'Refund',
  'order.support_note.updated': 'Note',
  'product.published': 'Publish',
  'product.details.updated': 'Update',
  'finance.commission_schedule.recorded': 'Rate',
  'finance.payout_account.onboarding_started': 'Onboard',
  'finance.payout_account.synced': 'Sync',
  'finance.payout_settings.updated': 'Update',
  'finance.provider_fee.recorded': 'Fee',
  'finance.settlement_currency.changed': 'Currency',
};

export type AuditBadgeTone = 'green' | 'gray' | 'yellow' | 'red' | 'blue';

export interface AuditTarget {
  label: string
  linkKind: 'order' | 'shop' | null
  linkId: string | null
}

/** Falls back to a readable form for entity types this screen does not know yet. */
function formatAuditEntityTypeLabel(entityType?: string) {
  if (!entityType) {
    return '';
  }

  const known = ENTITY_TYPE_LABELS[entityType];

  if (known) {
    return known;
  }

  return humanizeKey(entityType);
}

/** One short verb for the Action badge, never the dotted mutation code. */
export function formatAuditActionLabel(action?: string) {
  if (!action) {
    return '';
  }

  return ACTION_SHORT_LABELS[action] ??
    humanizeKey(action.split('.').filter(Boolean).at(-1) ?? action);
}

export function readAuditActionTone(action?: string): AuditBadgeTone {
  if (!action) {
    return 'gray';
  }

  if (action.includes('refund')) {
    return 'yellow';
  }

  if (/delete|failed/.test(action)) {
    return 'red';
  }

  if (/publish|onboard/.test(action)) {
    return 'green';
  }

  if (action.includes('note')) {
    return 'gray';
  }

  return 'blue';
}

/** Groups the row by the area an operator recognises, not the raw entity code. */
export function formatAuditModuleLabel(entityType?: string, action?: string): string {
  if (entityType === 'order' || entityType === 'product') {
    return entityType === 'order' ? 'Orders' : 'Products';
  }

  if (entityType === 'auth') {
    return 'Auth';
  }

  if (entityType === 'user' || entityType === 'role') {
    return 'Users';
  }

  if (entityType && FINANCE_ENTITY_TYPES[entityType]) {
    return 'Finance';
  }

  const prefix = action?.split('.')[0];
  const module = prefix ? ACTION_PREFIX_MODULES[prefix] : undefined;

  if (module) {
    return module;
  }

  return formatAuditEntityTypeLabel(entityType) || '—';
}

/** Order public ids carry the `ord_` prefix; anything else is a plain value. */
function isOrderPublicId(value?: string | null): value is string {
  return typeof value === 'string' && value.startsWith('ord_');
}

/** Shop public ids carry the `shop_` prefix; anything else is a plain value. */
function isShopPublicId(value?: string | null): value is string {
  return typeof value === 'string' && value.startsWith('shop_');
}

/**
 * Internal record ids are UUIDs. They are meaningless to an operator, so a
 * target falls back to its type label when no public id was recorded.
 */
const INTERNAL_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Turns the mutated entity into an operator-facing target and, when the public
 * id points at a detail screen, the link it should use.
 */
export function readAuditTarget(
  entityType?: string,
  publicId?: string | null,
  entityId?: string,
): AuditTarget {
  const rawId = publicId || entityId || '';
  const id = INTERNAL_ID_PATTERN.test(rawId) ? '' : rawId;
  const entityLabel = formatAuditEntityTypeLabel(entityType);

  if (entityType === 'order') {
    return {
      label: id ? `Order ${id}` : 'Order',
      linkKind: isOrderPublicId(publicId) ? 'order' : null,
      linkId: isOrderPublicId(publicId) ? publicId : null,
    };
  }

  if (entityType && FINANCE_ENTITY_TYPES[entityType]) {
    return {
      label: id ? `Shop ${id}` : entityLabel,
      linkKind: isShopPublicId(publicId) ? 'shop' : null,
      linkId: isShopPublicId(publicId) ? publicId : null,
    };
  }

  if (entityType === 'product') {
    return {
      label: id ? `Product ${id}` : 'Product',
      linkKind: null,
      linkId: null,
    };
  }

  return {
    label: [entityLabel || '—', id].filter(Boolean).join(' '),
    linkKind: null,
    linkId: null,
  };
}

export function formatAuditTimestamp(value?: string) {
  if (!value) {
    return '';
  }

  const date = dayjs(value);
  const format = date.year() === dayjs().year()
    ? 'D MMM, HH:mm:ss'
    : 'D MMM YYYY, HH:mm:ss';

  return date.format(format);
}

function humanizeKey(key: string) {
  const words = key
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll(/[_.]/g, ' ')
    .trim()
    .toLowerCase();

  return words.charAt(0).toUpperCase() + words.slice(1);
}
