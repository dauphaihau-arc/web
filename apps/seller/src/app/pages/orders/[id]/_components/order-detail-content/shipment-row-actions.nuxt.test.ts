import {
  afterEach, describe, expect, it, vi,
} from 'vitest';
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { ref } from 'vue';
import {
  FulfillmentAggregateStatuses,
  ShipmentLabelStatuses,
  ShipmentStatuses,
  ShipmentUpdateActorTypes,
  ShipmentUpdateSources,
} from '@arc/enums/fulfillment';
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail';
import ShipmentRowActions from './shipment-row-actions.vue';

const { modalOpen } = vi.hoisted(() => ({ modalOpen: vi.fn() }));

mockNuxtImport('useModal', () => () => ({ open: modalOpen, close: vi.fn() }));

const { declareShipmentHandoverMutate, refundLabelMutate } = vi.hoisted(() => ({
  declareShipmentHandoverMutate: vi.fn(),
  refundLabelMutate: vi.fn(),
}));

const { downloadLabel } = vi.hoisted(() => ({ downloadLabel: vi.fn() }));

vi.mock('~/domains/shop/api/order/order.api', () => ({
  shopOrderApi: { downloadLabel },
}));

vi.mock('~/domains/shop/utils/resolve-my-shop-id', () => ({
  resolveMyShopId: async () => 'shop-1',
}));

vi.mock('~/domains/shop/mutations/order-fulfillment.mutation', () => ({
  useShopOrderFulfillmentMutations: () => ({
    declareShipmentHandover: { mutateAsync: declareShipmentHandoverMutate, isPending: ref(false) },
    refundLabel: { mutateAsync: refundLabelMutate, isPending: ref(false) },
  }),
}));

function buildShipment(
  updateSource: ShipmentUpdateSources | 'none',
  overrides: Partial<ShopOrder['fulfillment']['groups'][number]['shipments'][number]> = {},
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
    ...overrides,
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

async function openMenu(
  updateSource: ShipmentUpdateSources | 'none',
  overrides: Partial<ShopOrder['fulfillment']['groups'][number]['shipments'][number]> = {},
) {
  const shipment = buildShipment(updateSource, overrides);
  wrapper = await mountSuspended(ShipmentRowActions, {
    props: { order: buildOrder(shipment), group: buildOrder(shipment).fulfillment.groups[0], shipment },
    attachTo: document.body,
  });
  await flushPromises();

  // A shipment with nothing left to do renders no actions at all.
  const trigger = wrapper.findAll('button').at(-1);
  if (trigger) {
    await trigger.trigger('click');
    await flushPromises();
  }

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

describe('shipment row actions handover', () => {
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    modalOpen.mockClear();
    declareShipmentHandoverMutate.mockClear();
    document.body.innerHTML = '';
  });

  it('offers "Mark as handed over" for a prepared shipment and declares it', async () => {
    await openMenu('none', {
      status: ShipmentStatuses.PREPARED,
      dispatched_at: undefined,
    });

    const button = document.body.querySelector<HTMLButtonElement>(
      'button[aria-label="Mark as handed over"]',
    );
    expect(button).not.toBeNull();

    button!.click();
    await flushPromises();

    expect(declareShipmentHandoverMutate).toHaveBeenCalledWith({
      orderId: 'order-1',
      shipmentId: 'shipment-1',
    });
  });

  it('offers voiding and editing while the shipment is prepared', async () => {
    const { menuText } = await openMenu('none', {
      status: ShipmentStatuses.PREPARED,
      dispatched_at: undefined,
    });

    expect(menuText).toContain('Edit shipment');
    expect(menuText).toContain('Void shipment');
  });

  it('offers no status control once the parcel is dispatched', async () => {
    const { menuText } = await openMenu('none');

    expect(document.body.querySelector('button[aria-label="Mark as handed over"]')).toBeNull();
    expect(menuText).toContain('Edit shipment');
    expect(menuText).not.toContain('Void shipment');
  });

  it('closes editing once the carrier has scanned the parcel', async () => {
    const { menuText } = await openMenu(ShipmentUpdateSources.CARRIER);

    expect(menuText).not.toContain('Edit shipment');
  });

  it('closes editing three days after the handover', async () => {
    await openMenu('none', {
      dispatched_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    });

    // Nothing is left to do on a dispatched parcel whose window has closed.
    expect(wrapper!.findAll('button')).toHaveLength(0);
  });
});

describe('shipment row actions label', () => {
  const LABEL = {
    public_id: 'lbl_123',
    service: 'standard' as const,
    status: ShipmentLabelStatuses.PURCHASED,
    price_minor: 980,
    currency: 'USD',
  };

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = '';
    downloadLabel.mockReset();
    refundLabelMutate.mockReset();
    vi.restoreAllMocks();
  });

  it('offers "Print label" and saves the downloaded PDF when a label exists', async () => {
    const blob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
    downloadLabel.mockResolvedValue(blob);

    const createObjectURL = vi.fn(() => 'blob:label');
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true });
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    const { menuText } = await openMenu('none', { label: LABEL });

    expect(menuText).toContain('Print label');

    const entry = Array.from(document.body.querySelectorAll('button'))
      .find(button => button.textContent?.includes('Print label'));
    expect(entry).toBeDefined();

    entry!.click();
    await flushPromises();

    expect(downloadLabel).toHaveBeenCalledWith('shop-1', 'order-1', 'shipment-1');
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(anchorClick).toHaveBeenCalled();
  });

  it('hides the print action when the shipment has no label', async () => {
    const { menuText } = await openMenu('none');

    expect(menuText).not.toContain('Print label');
    expect(downloadLabel).not.toHaveBeenCalled();
  });

  it('hides both the print and refund actions for a voided label', async () => {
    const { menuText } = await openMenu('none', {
      label: { ...LABEL, status: ShipmentLabelStatuses.VOIDED },
    });

    expect(menuText).not.toContain('Print label');
    expect(menuText).not.toContain('Refund label');
    expect(downloadLabel).not.toHaveBeenCalled();
  });

  it('offers "Refund label" for a purchased label and refunds it', async () => {
    const { menuText } = await openMenu('none', {
      status: ShipmentStatuses.PREPARED,
      dispatched_at: undefined,
      label: LABEL,
    });

    expect(menuText).toContain('Refund label');

    const entry = Array.from(document.body.querySelectorAll('button'))
      .find(button => button.textContent?.includes('Refund label'));
    expect(entry).toBeDefined();

    entry!.click();
    await flushPromises();

    expect(refundLabelMutate).toHaveBeenCalledWith({
      orderId: 'order-1',
      shipmentId: 'shipment-1',
    });
  });

  it('offers "Refund label" after handover but before the carrier scans', async () => {
    const { menuText } = await openMenu('none', { label: LABEL });

    expect(menuText).toContain('Refund label');
  });

  it('hides "Refund label" once the carrier has scanned the parcel', async () => {
    const { menuText } = await openMenu(ShipmentUpdateSources.CARRIER, { label: LABEL });

    expect(menuText).not.toContain('Refund label');
  });

  it('hides "Refund label" for a label that is already used', async () => {
    const { menuText } = await openMenu('none', {
      label: { ...LABEL, status: ShipmentLabelStatuses.USED },
    });

    expect(menuText).not.toContain('Refund label');
  });
});
