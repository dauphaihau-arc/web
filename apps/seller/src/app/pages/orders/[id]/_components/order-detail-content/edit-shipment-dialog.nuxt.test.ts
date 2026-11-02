import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { FulfillmentAggregateStatuses, ShipmentStatuses } from '@arc/enums/fulfillment';
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail';
import type { Carrier } from '~/domains/shop/api/carrier/contracts/carrier.contract';
import EditShipmentDialog from './edit-shipment-dialog.vue';

const { mutateAsync, modalClose, catalogueState } = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  modalClose: vi.fn(),
  catalogueState: { carriers: [] as unknown[] },
}));

mockNuxtImport('useModal', () => () => ({ close: modalClose }));

vi.mock('~/domains/shop/mutations/order-fulfillment.mutation', async () => {
  const { ref } = await import('vue');

  return {
    useShopOrderFulfillmentMutations: () => ({
      amendShipment: {
        mutateAsync,
        isPending: ref(false),
      },
    }),
  };
});

vi.mock('~/domains/shop/queries/carriers.query', async () => {
  const { ref } = await import('vue');

  return {
    useCarriers: () => ({
      data: ref({ carriers: catalogueState.carriers }),
    }),
  };
});

const CATALOGUE: Carrier[] = [
  {
    code: 'usps', name: 'USPS', tracking_pattern: '^9\\d{21}$', tracking_hint: '22 digits starting with 9', observable: true, label_supported: true,
  },
  {
    code: 'other', name: 'Other', observable: false, label_supported: false,
  },
];

function buildOrder(
  shipmentStatus: ShipmentStatuses = ShipmentStatuses.PREPARED,
  updates: unknown[] = [],
): ShopOrder {
  return {
    id: 'order-1',
    products: [{ id: 'item-1', title: 'Ceramic Mug' }],
    fulfillment: {
      status: FulfillmentAggregateStatuses.PREPARED,
      requires_reconciliation: false,
      progress: {
        ordered: 2, prepared: 2, dispatched: 0, delivered: 0, canceled: 0, outstanding: 0,
      },
      groups: [
        {
          id: 'group-1',
          method: 'seller',
          operator: 'seller',
          provenance: 'confirmed_order',
          items: [{ order_item_id: 'item-1', quantity: 2 }],
          progress: {
            ordered: 2, prepared: 2, dispatched: 0, delivered: 0, canceled: 0, outstanding: 0,
          },
          shipments: [
            {
              id: 'shipment-1',
              group_id: 'group-1',
              status: shipmentStatus,
              carrier: 'usps',
              tracking_number: '9400111899223456789012',
              origin_countries: ['US'],
              prepared_at: new Date(),
              created_at: new Date(),
              updated_at: new Date(),
              items: [{ order_item_id: 'item-1', quantity: 2 }],
              updates,
            },
          ],
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

async function render(
  shipmentStatus: ShipmentStatuses = ShipmentStatuses.PREPARED,
  updates: unknown[] = [],
) {
  const order = buildOrder(shipmentStatus, updates);
  wrapper = await mountSuspended(EditShipmentDialog, {
    props: {
      order,
      group: order.fulfillment.groups[0],
      shipment: order.fulfillment.groups[0].shipments[0],
    },
    attrs: { modelValue: true },
  });
  await flushPromises();

  return wrapper;
}

function bodyText() {
  return document.body.textContent ?? '';
}

function actionButton(label: string) {
  const button = [...document.body.querySelectorAll('button')].find(candidate => (
    candidate.textContent?.includes(label)
  ));
  expect(button).toBeDefined();
  return button!;
}

function formGroup(testId: string) {
  const group = document.body.querySelector(`[data-testid="${testId}"]`);
  expect(group).not.toBeNull();
  return group as HTMLElement;
}

function carrierTrigger() {
  const trigger = document.body.querySelector('[data-testid="shipment-carrier-select"]');
  expect(trigger).toBeDefined();
  return trigger as HTMLButtonElement;
}

async function chooseCarrier(name: string) {
  carrierTrigger().click();
  await flushPromises();

  const option = [...document.body.querySelectorAll('li')].find(candidate => (
    candidate.textContent?.trim() === name
  ));
  expect(option).toBeDefined();
  option!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
  await flushPromises();
}

async function typeTracking(value: string) {
  const input = document.body.querySelector('[data-testid="shipment-tracking-number"]') as HTMLInputElement;
  expect(input).toBeDefined();
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await flushPromises();
}

function trackingInput() {
  const input = document.body.querySelector('[data-testid="shipment-tracking-number"]') as HTMLInputElement;
  expect(input).not.toBeNull();
  return input;
}

describe('edit shipment dialog carrier select', () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    modalClose.mockReset();
    mutateAsync.mockResolvedValue({});
    catalogueState.carriers = CATALOGUE;
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = '';
  });

  it('preselects the shipment carrier by code', async () => {
    await render();

    expect(carrierTrigger().textContent).toContain('USPS');
    expect(formGroup('shipment-tracking-number-field').textContent).toContain('22 digits starting with 9');
    expect(formGroup('shipment-carrier-field').textContent).not.toContain('22 digits starting with 9');
  });

  it('explains the disabled carrier select when the catalogue is empty', async () => {
    catalogueState.carriers = [];

    await render();

    expect(carrierTrigger().disabled).toBe(true);
    expect(formGroup('shipment-carrier-field').textContent)
      .toContain('Carrier list is unavailable right now. Reload the page to choose one.');
    expect(formGroup('shipment-tracking-number-field').textContent)
      .not.toContain('Carrier list is unavailable');
  });

  it('stacks the carrier field above the tracking number field', async () => {
    await render();

    const carrierField = formGroup('shipment-carrier-field');
    const trackingField = formGroup('shipment-tracking-number-field');

    expect(trackingField.contains(document.body.querySelector('[data-testid="shipment-tracking-number"]'))).toBe(true);
    expect(carrierField.contains(carrierTrigger())).toBe(true);

    const layout = carrierField.parentElement;
    expect(layout).toBe(trackingField.parentElement);
    expect(layout?.className).not.toContain('grid-cols-2');
    expect(layout?.className).not.toContain('md:grid-cols-2');
    expect(carrierField.compareDocumentPosition(trackingField)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('keeps the shipment tracking number when it opens with the preselected carrier', async () => {
    await render();

    expect(carrierTrigger().textContent).toContain('USPS');
    expect(trackingInput().value).toBe('9400111899223456789012');
    expect(bodyText()).not.toContain('does not match');
    expect(actionButton('Save shipment').disabled).toBe(false);
  });

  it('clears a typed tracking number when the carrier changes', async () => {
    await render();

    await typeTracking('9999999999');

    expect(trackingInput().value).toBe('9999999999');

    await chooseCarrier('Other');

    expect(trackingInput().value).toBe('');
    expect(carrierTrigger().textContent).toContain('Other');
  });

  it('blocks saving a tracking number that does not match the selected carrier', async () => {
    await render();

    const errorMessage = 'That is not a USPS tracking number. Expected 22 digits starting with 9.';

    expect(bodyText()).not.toContain(errorMessage);

    await typeTracking('1234567890');

    expect(formGroup('shipment-tracking-number-field').textContent).toContain(errorMessage);
    expect(formGroup('shipment-carrier-field').textContent).not.toContain(errorMessage);
    expect(actionButton('Save shipment').disabled).toBe(true);

    await chooseCarrier('Other');

    expect(trackingInput().value).toBe('');
    expect(bodyText()).not.toContain('does not match');
    expect(actionButton('Save shipment').disabled).toBe(false);

    await typeTracking('1234567890');

    actionButton('Save shipment').click();
    await flushPromises();

    expect(mutateAsync).toHaveBeenCalledWith({
      orderId: 'order-1',
      shipmentId: 'shipment-1',
      body: {
        items: [{ order_item_id: 'item-1', quantity: 2 }],
        carrier: 'other',
        tracking_number: '1234567890',
        shipment_note: undefined,
      },
    });
  });

  it('locks quantities after handover and submits only carrier and tracking', async () => {
    await render(ShipmentStatuses.DISPATCHED);

    expect(bodyText()).toContain('only its carrier and tracking number can change');
    expect(trackingInput().value).toBe('9400111899223456789012');
    expect(actionButton('Save shipment').disabled).toBe(false);

    await typeTracking('9400111899223100009999');
    actionButton('Save shipment').click();
    await flushPromises();

    const payload = mutateAsync.mock.calls[0]![0] as {
      body: Record<string, unknown>
    };
    expect(payload.body).toEqual({
      carrier: 'usps',
      tracking_number: '9400111899223100009999',
      shipment_note: undefined,
    });
    expect('items' in payload.body).toBe(false);
  });
});
