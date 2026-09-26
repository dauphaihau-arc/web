import { ShippingProfileStatuses, type ShippingProfileStatus } from '@arc/enums/shipping';
import type { ShippingProfileListResponse } from '~/domains/shop/api/shipping-profile/contracts/shipping-profile.contract';

/**
 * The views of the Shipping Settings list. `All` follows the seller product
 * list: it means every listable state — active and draft — and never the
 * terminal one. Archived profiles are retained for audit but are not part of
 * the working list, so they have their own view.
 */
export const SHIPPING_PROFILE_LIST_VIEWS = {
  ALL: 'all',
  ACTIVE: 'active',
  DRAFT: 'draft',
  ARCHIVED: 'archived',
} as const;

export type ShippingProfileListView =
  (typeof SHIPPING_PROFILE_LIST_VIEWS)[keyof typeof SHIPPING_PROFILE_LIST_VIEWS];

type ShippingProfileStatusCounts = ShippingProfileListResponse['status_counts'];

const SHIPPING_PROFILE_LIST_VIEW_ORDER: ShippingProfileListView[] = [
  SHIPPING_PROFILE_LIST_VIEWS.ALL,
  SHIPPING_PROFILE_LIST_VIEWS.ACTIVE,
  SHIPPING_PROFILE_LIST_VIEWS.DRAFT,
  SHIPPING_PROFILE_LIST_VIEWS.ARCHIVED,
];

/** The lifecycle states each view asks the API for. */
export const SHIPPING_PROFILE_LIST_VIEW_STATUSES: Record<ShippingProfileListView, ShippingProfileStatus[]> = {
  [SHIPPING_PROFILE_LIST_VIEWS.ALL]: [ShippingProfileStatuses.ACTIVE, ShippingProfileStatuses.DRAFT],
  [SHIPPING_PROFILE_LIST_VIEWS.ACTIVE]: [ShippingProfileStatuses.ACTIVE],
  [SHIPPING_PROFILE_LIST_VIEWS.DRAFT]: [ShippingProfileStatuses.DRAFT],
  [SHIPPING_PROFILE_LIST_VIEWS.ARCHIVED]: [ShippingProfileStatuses.ARCHIVED],
};

const SHIPPING_PROFILE_LIST_VIEW_META: Record<
  ShippingProfileListView,
  { label: string, countedStatuses: Array<keyof ShippingProfileStatusCounts> }
> = {
  [SHIPPING_PROFILE_LIST_VIEWS.ALL]: {
    label: 'All',
    countedStatuses: ['active', 'draft'],
  },
  [SHIPPING_PROFILE_LIST_VIEWS.ACTIVE]: {
    label: 'Active',
    countedStatuses: ['active'],
  },
  [SHIPPING_PROFILE_LIST_VIEWS.DRAFT]: {
    label: 'Draft',
    countedStatuses: ['draft'],
  },
  [SHIPPING_PROFILE_LIST_VIEWS.ARCHIVED]: {
    label: 'Archived',
    countedStatuses: ['archived'],
  },
};

export function buildShippingProfileListViewTabs(
  counts?: ShippingProfileStatusCounts,
): Array<{ label: string, value: ShippingProfileListView }> {
  return SHIPPING_PROFILE_LIST_VIEW_ORDER.map((view) => {
    const meta = SHIPPING_PROFILE_LIST_VIEW_META[view];
    const count = meta.countedStatuses.reduce(
      (sum, status) => sum + (counts?.[status] ?? 0),
      0,
    );

    return { label: `${meta.label} (${count})`, value: view };
  });
}
