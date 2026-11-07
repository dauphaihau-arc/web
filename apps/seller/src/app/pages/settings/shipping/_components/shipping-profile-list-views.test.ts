import { describe, expect, it } from 'vitest';
import { ShippingProfileStatuses } from '@arc/enums/shipping';
import {
  buildShippingProfileListViewTabs,
  SHIPPING_PROFILE_LIST_VIEWS,
  SHIPPING_PROFILE_LIST_VIEW_STATUSES,
} from './shipping-profile-list-views';

describe('shipping profile list views', () => {
  it('lists the working states by default and never folds archived into them', () => {
    expect(SHIPPING_PROFILE_LIST_VIEW_STATUSES[SHIPPING_PROFILE_LIST_VIEWS.ALL]).toEqual([
      ShippingProfileStatuses.ACTIVE,
      ShippingProfileStatuses.DRAFT,
    ]);
    expect(SHIPPING_PROFILE_LIST_VIEW_STATUSES[SHIPPING_PROFILE_LIST_VIEWS.ACTIVE]).toEqual([
      ShippingProfileStatuses.ACTIVE,
    ]);
    expect(SHIPPING_PROFILE_LIST_VIEW_STATUSES[SHIPPING_PROFILE_LIST_VIEWS.DRAFT]).toEqual([
      ShippingProfileStatuses.DRAFT,
    ]);
    expect(SHIPPING_PROFILE_LIST_VIEW_STATUSES[SHIPPING_PROFILE_LIST_VIEWS.ARCHIVED]).toEqual([
      ShippingProfileStatuses.ARCHIVED,
    ]);
  });

  it('counts each view, with All covering the working states only', () => {
    expect(buildShippingProfileListViewTabs({ active: 2, draft: 1, archived: 4 })).toEqual([
      { label: 'All', value: SHIPPING_PROFILE_LIST_VIEWS.ALL, badge: 3 },
      { label: 'Active', value: SHIPPING_PROFILE_LIST_VIEWS.ACTIVE, badge: 2 },
      { label: 'Draft', value: SHIPPING_PROFILE_LIST_VIEWS.DRAFT, badge: 1 },
      { label: 'Archived', value: SHIPPING_PROFILE_LIST_VIEWS.ARCHIVED, badge: 4 },
    ]);
  });

  it('counts zero before the first response arrives', () => {
    expect(buildShippingProfileListViewTabs().map(tab => tab.badge)).toEqual([0, 0, 0, 0]);
  });
});
