import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import type { OrderPackage } from './order-detail-presentation';
import OrderPackageCard from './order-package-card.vue';

function buildPackage(overrides: Partial<OrderPackage> = {}): OrderPackage {
  return {
    id: 'package-1',
    index: 1,
    total: 1,
    state: 'shipped',
    statusLabel: 'Shipped',
    statusDetail: 'Mar 02',
    estimateDetail: '',
    shipByDetail: '',
    lines: [],
    stages: [],
    updates: [],
    ...overrides,
  };
}

describe('order package card carrier events', () => {
  it('lists carrier events with location and failure wording behind the toggle', async () => {
    const wrapper = await mountSuspended(OrderPackageCard, {
      props: {
        orderPackage: buildPackage({
          updates: [
            {
              id: 'update-failed',
              title: 'Delivery failed',
              location: 'Austin, TX',
              occurredAt: 'Oct 31, 09:00',
            },
            {
              id: 'update-returned',
              title: 'Returned to sender',
              occurredAt: 'Nov 01, 09:00',
            },
          ],
        }),
      },
    });

    expect(wrapper.text()).not.toContain('Austin, TX');

    const toggle = wrapper.findAll('button').find(button => button.text().includes('Track package'));
    await toggle!.trigger('click');

    expect(wrapper.text()).toContain('Delivery failed');
    expect(wrapper.text()).toContain('Austin, TX');
    expect(wrapper.text()).toContain('Returned to sender');
  });
});

describe('order package card carrier line', () => {
  it('shows the carrier display name and tracking number', async () => {
    const wrapper = await mountSuspended(OrderPackageCard, {
      props: {
        orderPackage: buildPackage({
          carrier: 'usps',
          carrierName: 'USPS',
          trackingNumber: '9400111899223456789012',
        }),
      },
    });

    expect(wrapper.text()).toContain('Carrier: USPS · Tracking: 9400111899223456789012');
  });

  it('marks tracking from a non-observable carrier as unverified', async () => {
    const wrapper = await mountSuspended(OrderPackageCard, {
      props: {
        orderPackage: buildPackage({
          carrier: 'other',
          carrierName: 'Other',
          trackingNumber: 'TRACK-1',
          trackingUnverified: true,
        }),
      },
    });

    expect(wrapper.text()).toContain('Carrier: Other · Tracking: TRACK-1 (unverified)');
  });

  it('falls back to the carrier code when no display name is present', async () => {
    const wrapper = await mountSuspended(OrderPackageCard, {
      props: {
        orderPackage: buildPackage({
          carrier: 'dhl',
          carrierName: 'dhl',
          trackingNumber: '1234567890',
        }),
      },
    });

    expect(wrapper.text()).toContain('Carrier: dhl · Tracking: 1234567890');
  });
});
