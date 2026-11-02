import {
  afterEach, describe, expect, it, vi,
} from 'vitest';
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { FulfillmentAggregateStatuses, ShipmentStatuses } from '@arc/enums/fulfillment';
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail';
import Shipments from './shipments.vue';

mockNuxtImport('useModal', () => () => ({ open: vi.fn(), close: vi.fn() }));

vi.mock('~/domains/shop/mutations/order-fulfillment.mutation', async () => {
  const { ref } = await import('vue');

  return {
    useShopOrderFulfillmentMutations: () => ({
      declareShipmentHandover: { mutateAsync: vi.fn(), isPending: ref(false) },
      voidShipment: { mutateAsync: vi.fn(), isPending: ref(false) },
    }),
  };
});

function buildShipment(input: {
  id: string
  carrier: string
  carrierName?: string
  carrierObservable?: boolean
  trackingNumber?: string
}): ShopOrder['fulfillment']['groups'][number]['shipments'][number] {
  return {
    id: input.id,
    group_id: 'group-1',
    status: ShipmentStatuses.DISPATCHED,
    carrier: input.carrier,
    carrier_name: input.carrierName,
    carrier_observable: input.carrierObservable,
    tracking_number: input.trackingNumber,
    origin_countries: ['US'],
    prepared_at: new Date(),
    dispatched_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    items: [{ order_item_id: 'item-1', quantity: 1 }],
    updates: [],
  };
}

function buildOrder(): ShopOrder {
  const shipments = [
    buildShipment({
      id: 'shipment-1',
      carrier: 'usps',
      carrierName: 'USPS',
      carrierObservable: true,
      trackingNumber: '9400111899223456789012',
    }),
    buildShipment({
      id: 'shipment-2',
      carrier: 'other',
      carrierName: 'Other',
      carrierObservable: false,
      trackingNumber: 'TRACK-2',
    }),
    buildShipment({
      id: 'shipment-3',
      carrier: 'dhl',
      carrierObservable: true,
      trackingNumber: '1234567890',
    }),
  ];

  return {
    id: 'order-1',
    products: [{ id: 'item-1', title: 'Ceramic Mug' }],
    fulfillment: {
      status: FulfillmentAggregateStatuses.SHIPPED,
      requires_reconciliation: false,
      progress: {
        ordered: 3, prepared: 0, dispatched: 3, delivered: 0, canceled: 0, outstanding: 0,
      },
      groups: [
        {
          id: 'group-1',
          method: 'seller',
          operator: 'seller',
          provenance: 'confirmed_order',
          items: [{ order_item_id: 'item-1', quantity: 3 }],
          progress: {
            ordered: 3, prepared: 0, dispatched: 3, delivered: 0, canceled: 0, outstanding: 0,
          },
          shipments,
        },
      ],
      legacy_shipping: {
        status: 'pending',
        updated_at: new Date(),
        to_country: 'US',
        from_countries: [],
        estimated_delivery: new Date(),
      },
    },
  } as unknown as ShopOrder;
}

let wrapper: VueWrapper | undefined;

async function render() {
  wrapper = await mountSuspended(Shipments, { props: { order: buildOrder() } });
  await flushPromises();

  return wrapper;
}

describe('shipments table carrier column', () => {
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = '';
  });

  it('shows the server-resolved carrier name and falls back to the code', async () => {
    const text = (await render()).text();

    expect(text).toContain('USPS');
    expect(text).toContain('Other');
    expect(text).toContain('dhl');
  });

  it('marks only non-observable carriers with a tracking number as unverified', async () => {
    const text = (await render()).text();

    expect(text).toContain('Unverified');
    expect(text.match(/Unverified/g)).toHaveLength(1);
  });
});
