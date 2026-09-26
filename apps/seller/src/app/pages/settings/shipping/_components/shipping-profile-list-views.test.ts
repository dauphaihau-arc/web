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
      { label: 'All (3)', value: SHIPPING_PROFILE_LIST_VIEWS.ALL },
      { label: 'Active (2)', value: SHIPPING_PROFILE_LIST_VIEWS.ACTIVE },
      { label: 'Draft (1)', value: SHIPPING_PROFILE_LIST_VIEWS.DRAFT },
      { label: 'Archived (4)', value: SHIPPING_PROFILE_LIST_VIEWS.ARCHIVED },
    ]);
  });

  it('counts zero before the first response arrives', () => {
    expect(buildShippingProfileListViewTabs().map(tab => tab.label)).toEqual([
      'All (0)',
      'Active (0)',
      'Draft (0)',
      'Archived (0)',
    ]);
  });
});
