import {
  FulfillmentAggregateStatuses,
  FulfillmentMethods,
  FulfillmentOperators,
  FulfillmentProvenances,
  ShipmentStatuses,
} from '@arc/enums/fulfillment';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type {
  FulfillmentGroup,
  FulfillmentShipment,
  LegacyOrderShipping, GetOrderShopsResponse,
} from '~/domains/me/api/order/contracts/order.contract';
import ShopShippingInfo from './shop-shipping-info.vue';

type OrderShop = GetOrderShopsResponse['order_shops'][number];

type ShipmentFixture = {
  id: string
  status: ShipmentStatuses
  carrier?: string
  trackingNumber?: string
  note?: string
  quantity?: number
  orderItemId?: string
  preparedAt?: Date
  dispatchedAt?: Date
  deliveredAt?: Date
};

function buildShipment(fixture: ShipmentFixture): FulfillmentShipment {
  return {
    id: fixture.id,
    group_id: 'group-ignored',
    status: fixture.status,
    carrier: fixture.carrier,
    tracking_number: fixture.trackingNumber,
    shipment_note: fixture.note,
    origin_countries: ['US'],
    prepared_at: fixture.preparedAt ?? new Date('2026-03-01T10:00:00.000Z'),
    dispatched_at: fixture.dispatchedAt,
    delivered_at: fixture.deliveredAt,
    created_at: new Date('2026-03-01T10:00:00.000Z'),
    updated_at: new Date('2026-03-01T10:00:00.000Z'),
    items: [
      {
        order_item_id: fixture.orderItemId ?? 'order-item-1',
        quantity: fixture.quantity ?? 1,
      },
    ],
    updates: [],
  };
}

function buildGroup(input: {
  id: string
  shipments: FulfillmentShipment[]
  ordered?: number
}): FulfillmentGroup {
  const ordered = input.ordered ?? input.shipments.reduce(
    (total, shipment) => total + shipment.items.reduce((sum, item) => sum + item.quantity, 0),
    0,
  );

  return {
    id: input.id,
    method: FulfillmentMethods.SELLER,
    operator: FulfillmentOperators.SELLER,
    provenance: FulfillmentProvenances.CONFIRMED_ORDER,
    items: input.shipments.flatMap(shipment => shipment.items),
    progress: {
      ordered,
      prepared: 0,
      dispatched: 0,
      delivered: 0,
      canceled: 0,
      outstanding: ordered,
    },
    shipments: input.shipments,
  };
}

function buildOrderShop(input: {
  groups: FulfillmentGroup[]
  status?: FulfillmentAggregateStatuses
  legacyShipping?: Partial<LegacyOrderShipping>
  shipping?: unknown
}): OrderShop {
  return {
    id: 'order-1',
    order_number: 'ORD-1',
    shop: { id: 'shop-1', shop_name: 'Shop', slug: 'shop' },
    payment: { type: 'card' },
    status: 'paid',
    products: [
      {
        id: 'order-item-1',
        title: 'Ceramic Mug',
        quantity: 2,
        amount_minor: 1999,
        currency: 'USD',
        inventory: {},
        product: { id: 'product-1', slug: 'mug', shop: { slug: 'shop' } },
      },
    ],
    promo_codes: [],
    fulfillment: {
      status: input.status ?? (input.groups.length > 0 ? 'delivered' : 'unfulfilled'),
      requires_reconciliation: false,
      progress: {
        ordered: 2, prepared: 0, dispatched: 2, delivered: 2, canceled: 0, outstanding: 0,
      },
      groups: input.groups,
      legacy_shipping: {
        status: 'pre_transit',
        updated_at: new Date('2026-02-01T00:00:00.000Z'),
        to_country: 'US',
        from_countries: ['US'],
        estimated_delivery: new Date('2026-02-10T00:00:00.000Z'),
        ...input.legacyShipping,
      },
    },
    currency: 'USD',
    subtotal_minor: 3998,
    shipping_minor: 0,
    discount_minor: 0,
    total_minor: 3998,
    created_at: '2026-02-01T00:00:00.000Z',
    shipping: input.shipping,
  } as unknown as OrderShop;
}

function render(orderShop: OrderShop, display: 'summary' | 'detail' = 'detail') {
  return mount(ShopShippingInfo, { props: { orderShop, display } });
}

describe('shop shipping info', () => {
  it('summarizes a complete single Shipment and reveals its items on request', async () => {
    const wrapper = render(buildOrderShop({
      groups: [
        buildGroup({
          id: 'group-1',
          shipments: [
            buildShipment({
              id: 'shipment-1',
              status: ShipmentStatuses.DELIVERED,
              carrier: 'USPS',
              trackingNumber: 'TRACK-1',
              note: 'Left at the front desk',
              quantity: 2,
              preparedAt: new Date('2026-03-01T10:00:00.000Z'),
              dispatchedAt: new Date('2026-03-02T10:00:00.000Z'),
              deliveredAt: new Date('2026-03-04T10:00:00.000Z'),
            }),
          ],
        }),
      ],
    }));

    const text = wrapper.text();

    expect(text).toContain('Shipping');
    expect(text).toContain('Delivered');
    expect(text).toContain('Carrier: USPS');
    expect(text).toContain('Tracking: TRACK-1');
    expect(text).toContain('Note: Left at the front desk');
    expect(text).toContain('2 items delivered');
    expect(text).toContain('View items');
    expect(text).not.toContain('2 × Ceramic Mug');
    expect(text).toContain('Mar 02, 2026');

    await wrapper.get('button').trigger('click');
    expect(wrapper.text()).toContain('2 × Ceramic Mug');
    expect(wrapper.text()).toContain('Hide items');

    // A single group is not a shipment, and nothing internal is exposed.
    expect(text).not.toContain('Shipment 1 of 1');
    expect(text).not.toContain('Delivery 1');
    expect(text).not.toContain('Fulfillment group');
    expect(text).not.toContain('seller');
  });

  it('numbers flattened Shipments without exposing internal group identity', () => {
    const wrapper = render(buildOrderShop({
      groups: [
        buildGroup({
          id: 'group-1',
          shipments: [buildShipment({ id: 'shipment-1', status: ShipmentStatuses.DELIVERED, quantity: 1 })],
        }),
        buildGroup({
          id: 'group-2',
          shipments: [buildShipment({ id: 'shipment-2', status: ShipmentStatuses.IN_TRANSIT, quantity: 1 })],
        }),
      ],
    }));

    const text = wrapper.text();

    expect(text).toContain('Shipping');
    expect(text).toContain('Shipment 1 of 2');
    expect(text).toContain('Shipment 2 of 2');
    expect(text).not.toContain('Delivery 1');
    expect(text).not.toContain('seller');
    expect(text).not.toContain('group-1');
    expect(text).not.toContain('group-2');
  });

  it('numbers Shipments only when a delivery contains more than one', () => {
    const wrapper = render(buildOrderShop({
      groups: [
        buildGroup({
          id: 'group-1',
          ordered: 3,
          shipments: [
            buildShipment({ id: 'shipment-1', status: ShipmentStatuses.DELIVERED, quantity: 2 }),
            buildShipment({ id: 'shipment-2', status: ShipmentStatuses.IN_TRANSIT, quantity: 1 }),
          ],
        }),
      ],
    }));

    const text = wrapper.text();

    expect(text).toContain('Shipment 1 of 2');
    expect(text).toContain('Shipment 2 of 2');
    expect(text).not.toContain('Delivery 1');
  });

  it('does not render voided preparation as a buyer-facing consignment', () => {
    const wrapper = render(buildOrderShop({
      groups: [
        buildGroup({
          id: 'group-1',
          ordered: 2,
          shipments: [
            buildShipment({ id: 'shipment-voided', status: ShipmentStatuses.VOIDED, quantity: 2 }),
          ],
        }),
      ],
    }));

    const text = wrapper.text();

    expect(text).not.toContain('Voided');
    expect(text).not.toContain('Shipment 1 of 1');
  });

  it('shows only the server aggregate in summary mode', () => {
    const partiallyShipped = render(buildOrderShop({
      status: FulfillmentAggregateStatuses.PARTIALLY_SHIPPED,
      groups: [
        buildGroup({
          id: 'group-1',
          ordered: 2,
          shipments: [buildShipment({
            id: 'shipment-1',
            status: ShipmentStatuses.IN_TRANSIT,
            carrier: 'DHL',
            trackingNumber: 'TRACK-1',
            quantity: 1,
          })],
        }),
      ],
    }), 'summary');
    const text = partiallyShipped.text();

    expect(text).toContain('Partially shipped');
    expect(text).toContain('Some items are on the way');
    expect(text).not.toContain('Shipping');
    expect(text).not.toContain('Carrier: DHL');
    expect(text).not.toContain('Tracking: TRACK-1');
    expect(text).not.toContain('Shipment 1');
  });

  it('shows the server aggregate with buyer-safe copy in detail mode', () => {
    const partiallyDelivered = render(buildOrderShop({
      status: FulfillmentAggregateStatuses.PARTIALLY_DELIVERED,
      groups: [
        buildGroup({
          id: 'group-1',
          ordered: 2,
          shipments: [buildShipment({ id: 'shipment-1', status: ShipmentStatuses.DELIVERED, quantity: 1 })],
        }),
      ],
    }));
    expect(partiallyDelivered.text()).toContain('Partially delivered');
    expect(partiallyDelivered.text()).toContain('Some items have arrived');
  });

  it('falls back to Legacy shipping only when there is no group and legacy facts exist', () => {
    const withFacts = render(buildOrderShop({
      groups: [],
      legacyShipping: {
        status: ShipmentStatuses.IN_TRANSIT,
        tracking_number: 'LEGACY-TRACK',
        carrier: 'FedEx',
        note: 'Historic note',
        shipped_at: new Date('2026-01-05T00:00:00.000Z'),
      },
    }));
    const legacyText = withFacts.text();

    expect(legacyText).toContain('Legacy shipping');
    expect(legacyText).toContain('Tracking: LEGACY-TRACK');
    expect(legacyText).toContain('Carrier: FedEx');
    expect(legacyText).toContain('Note: Historic note');
    expect(legacyText).not.toContain('Shipping');

    const withoutFacts = render(buildOrderShop({ groups: [] }));
    expect(withoutFacts.text()).not.toContain('Legacy shipping');
    expect(withoutFacts.text()).not.toContain('Shipping');

    // Groups win: legacy evidence is never rendered alongside the new model.
    const withGroups = render(buildOrderShop({
      groups: [
        buildGroup({
          id: 'group-1',
          shipments: [buildShipment({ id: 'shipment-1', status: ShipmentStatuses.PREPARED, quantity: 2 })],
        }),
      ],
      legacyShipping: { tracking_number: 'LEGACY-TRACK' },
    }));
    expect(withGroups.text()).not.toContain('Legacy shipping');
  });

  it('shows the accepted seller estimate without internal or guarantee claims', () => {
    const shipping = {
      estimate: {
        earliest_delivery_date: '2026-09-26T00:00:00.000Z',
        latest_delivery_date: '2026-09-30T00:00:00.000Z',
      },
    };

    const detail = render(buildOrderShop({ groups: [], shipping }));
    // The window states the shared month once and omits the current year.
    expect(detail.text()).toMatch(/Estimated delivery: Sep 26 - 30(?:, \d{4})?/);
    // The estimate is a seller forecast: the buyer page carries no guarantee claim.
    expect(detail.text()).not.toContain('guarantee');
    expect(detail.text()).not.toContain('From ');

    const summary = render(buildOrderShop({ groups: [], shipping }), 'summary');
    expect(summary.text()).toMatch(/Estimated delivery: Sep 26 - 30(?:, \d{4})?/);
  });
});
