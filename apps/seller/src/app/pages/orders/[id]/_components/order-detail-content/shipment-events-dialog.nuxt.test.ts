import {
  afterEach, describe, expect, it, vi,
} from 'vitest';
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import {
  ShipmentStatuses,
  ShipmentUpdateActorTypes,
  ShipmentUpdateSources,
} from '@arc/enums/fulfillment';
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail';
import ShipmentEventsDialog from './shipment-events-dialog.vue';

mockNuxtImport('useModal', () => () => ({ open: vi.fn(), close: vi.fn() }));

function buildShipment(): ShopOrder['fulfillment']['groups'][number]['shipments'][number] {
  return {
    id: 'shipment-1',
    group_id: 'group-1',
    status: ShipmentStatuses.IN_TRANSIT,
    carrier: 'usps',
    carrier_name: 'USPS',
    tracking_number: '9400111899223456789012',
    origin_countries: ['US'],
    prepared_at: new Date(),
    dispatched_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    items: [{ order_item_id: 'item-1', quantity: 1 }],
    updates: [
      {
        id: 'update-transit',
        status: ShipmentStatuses.IN_TRANSIT,
        actor_type: ShipmentUpdateActorTypes.CARRIER,
        actor_id: 'usps',
        source: ShipmentUpdateSources.CARRIER,
        occurred_at: new Date(2026, 9, 31, 9, 0),
        event_code: 'IN_TRANSIT',
        location: 'Austin, TX',
      },
      {
        id: 'update-failed',
        status: ShipmentStatuses.IN_TRANSIT,
        actor_type: ShipmentUpdateActorTypes.CARRIER,
        actor_id: 'usps',
        source: ShipmentUpdateSources.CARRIER,
        occurred_at: new Date(2026, 10, 1, 9, 0),
        event_code: 'DELIVERY_FAILED',
        location: 'Round Rock, TX',
      },
      {
        id: 'update-prepared',
        status: ShipmentStatuses.PREPARED,
        actor_type: ShipmentUpdateActorTypes.SELLER,
        actor_id: 'seller-1',
        source: ShipmentUpdateSources.SELLER,
        occurred_at: new Date(2026, 10, 3, 9, 0),
        note: 'Shipment prepared',
      },
      {
        id: 'update-returned',
        status: ShipmentStatuses.IN_TRANSIT,
        actor_type: ShipmentUpdateActorTypes.CARRIER,
        actor_id: 'usps',
        source: ShipmentUpdateSources.CARRIER,
        occurred_at: new Date(2026, 10, 2, 9, 0),
        event_code: 'RETURNED',
      },
    ],
  } as unknown as ShopOrder['fulfillment']['groups'][number]['shipments'][number];
}

let wrapper: VueWrapper | undefined;

async function render() {
  wrapper = await mountSuspended(ShipmentEventsDialog, {
    props: { shipment: buildShipment() },
    attrs: { modelValue: true },
  });
  await flushPromises();

  return document.body.textContent ?? '';
}

describe('shipment events dialog', () => {
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = '';
  });

  it('lists every carrier event with readable wording, location, timestamp and status', async () => {
    const text = await render();

    expect(text).toContain('Tracking events');
    expect(text).toContain('Carrier scans for 9400111899223456789012.');

    expect(text).toContain('Returned to sender');
    expect(text).toContain('Delivery failed');
    expect(text).toContain('Round Rock, TX');
    expect(text).toContain('Austin, TX');

    expect(text.match(/in transit/gi)).toHaveLength(4);
    expect(text).toContain('In transit');
    expect(text).toContain('Nov 2, 2026 at 9:00 AM');
    expect(text).toContain('Nov 1, 2026 at 9:00 AM');
    expect(text).toContain('Oct 31, 2026 at 9:00 AM');
  });

  it('leaves seller and system evidence out of the carrier timeline', async () => {
    const text = await render();

    expect(text).not.toContain('Shipment prepared');
    expect(text).not.toContain('Nov 3, 2026');
  });

  it('orders the carrier scans newest first', async () => {
    const text = await render();
    const returned = text.indexOf('Returned to sender');
    const failed = text.indexOf('Delivery failed');
    const transit = text.indexOf('In transit');

    expect(returned).toBeGreaterThan(-1);
    expect(failed).toBeGreaterThan(returned);
    expect(transit).toBeGreaterThan(failed);
  });
});
