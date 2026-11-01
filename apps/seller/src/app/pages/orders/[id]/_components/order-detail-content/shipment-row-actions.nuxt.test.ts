import {
  afterEach, describe, expect, it, vi,
} from 'vitest';
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { ref } from 'vue';
import {
  FulfillmentAggregateStatuses,
  ShipmentStatuses,
  ShipmentUpdateActorTypes,
  ShipmentUpdateSources,
} from '@arc/enums/fulfillment';
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail';
import ShipmentRowActions from './shipment-row-actions.vue';

const { modalOpen } = vi.hoisted(() => ({ modalOpen: vi.fn() }));

mockNuxtImport('useModal', () => () => ({ open: modalOpen, close: vi.fn() }));

vi.mock('~/domains/shop/mutations/order-fulfillment.mutation', () => ({
  useShopOrderFulfillmentMutations: () => ({
    updateShipmentJourney: { mutateAsync: vi.fn(), isPending: ref(false) },
  }),
}));

function buildShipment(
  updateSource: ShipmentUpdateSources | 'none',
): ShopOrder['fulfillment']['groups'][number]['shipments'][number] {
  return {
    id: 'shipment-1',
    group_id: 'group-1',
    status: ShipmentStatuses.DISPATCHED,
    carrier: 'usps',
    carrier_name: 'USPS',
    tracking_number: '9400111899223456789012',
    origin_countries: ['US'],
    prepared_at: new Date(),
    dispatched_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    items: [{ order_item_id: 'item-1', quantity: 1 }],
    updates: updateSource === 'none'
      ? []
      : [{
        id: 'update-1',
        status: ShipmentStatuses.IN_TRANSIT,
        actor_type: updateSource === ShipmentUpdateSources.CARRIER
          ? ShipmentUpdateActorTypes.CARRIER
          : ShipmentUpdateActorTypes.SELLER,
        actor_id: updateSource,
        source: updateSource,
        occurred_at: new Date('2026-10-31T09:00:00.000Z'),
        event_code: 'IN_TRANSIT',
        location: 'Austin, TX',
      }],
  } as unknown as ShopOrder['fulfillment']['groups'][number]['shipments'][number];
}

function buildOrder(shipment: ShopOrder['fulfillment']['groups'][number]['shipments'][number]): ShopOrder {
  return {
    id: 'order-1',
    status: 'processing',
    products: [{ id: 'item-1', title: 'Ceramic Mug' }],
    fulfillment: {
      status: FulfillmentAggregateStatuses.SHIPPED,
      requires_reconciliation: false,
      progress: {
        ordered: 1, prepared: 0, dispatched: 1, delivered: 0, canceled: 0, outstanding: 0,
      },
      groups: [
        {
          id: 'group-1',
          method: 'seller',
          operator: 'seller',
          provenance: 'confirmed_order',
          items: [{ order_item_id: 'item-1', quantity: 1 }],
          progress: {
            ordered: 1, prepared: 0, dispatched: 1, delivered: 0, canceled: 0, outstanding: 0,
          },
          shipments: [shipment],
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

async function openMenu(updateSource: ShipmentUpdateSources | 'none') {
  const shipment = buildShipment(updateSource);
  wrapper = await mountSuspended(ShipmentRowActions, {
    props: { order: buildOrder(shipment), group: buildOrder(shipment).fulfillment.groups[0], shipment },
    attachTo: document.body,
  });
  await flushPromises();

  const trigger = wrapper.findAll('button').at(-1);
  await trigger!.trigger('click');
  await flushPromises();

  return { shipment, menuText: document.body.textContent ?? '' };
}

describe('shipment row actions tracking events', () => {
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    modalOpen.mockClear();
    document.body.innerHTML = '';
  });

  it('offers the tracking events dialog when the shipment carries updates', async () => {
    const { shipment, menuText } = await openMenu(ShipmentUpdateSources.CARRIER);

    expect(menuText).toContain('View tracking events');

    const entry = Array.from(document.body.querySelectorAll('button'))
      .find(button => button.textContent?.includes('View tracking events'));
    await entry!.click();
    await flushPromises();

    expect(modalOpen).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ shipment }),
    );
  });

  it('hides the menu entry when there are no updates', async () => {
    const { menuText } = await openMenu('none');

    expect(menuText).not.toContain('View tracking events');
  });

  it('hides the menu entry when only seller evidence was recorded', async () => {
    const { menuText } = await openMenu(ShipmentUpdateSources.SELLER);

    expect(menuText).not.toContain('View tracking events');
  });
});
