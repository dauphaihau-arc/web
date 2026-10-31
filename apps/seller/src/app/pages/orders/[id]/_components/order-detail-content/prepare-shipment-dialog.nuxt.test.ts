import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { FulfillmentAggregateStatuses } from '@arc/enums/fulfillment';
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail';
import type { Carrier } from '~/domains/shop/api/carrier/contracts/carrier.contract';
import PrepareShipmentDialog from './prepare-shipment-dialog.vue';

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
      prepareShipment: {
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
    code: 'dhl', name: 'DHL', tracking_pattern: '^\\d{10}$', tracking_hint: '10 digits', observable: true, label_supported: true,
  },
  {
    code: 'other', name: 'Other', observable: false, label_supported: false,
  },
];

function buildOrder(): ShopOrder {
  return {
    id: 'order-1',
    products: [{ id: 'item-1', title: 'Ceramic Mug' }],
    fulfillment: {
      status: FulfillmentAggregateStatuses.UNFULFILLED,
      requires_reconciliation: false,
      progress: {
        ordered: 2, prepared: 0, dispatched: 0, delivered: 0, canceled: 0, outstanding: 2,
      },
      groups: [
        {
          id: 'group-1',
          method: 'seller',
          operator: 'seller',
          provenance: 'confirmed_order',
          items: [{ order_item_id: 'item-1', quantity: 2 }],
          progress: {
            ordered: 2, prepared: 0, dispatched: 0, delivered: 0, canceled: 0, outstanding: 2,
          },
          shipments: [],
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
  const order = buildOrder();
  wrapper = await mountSuspended(PrepareShipmentDialog, {
    props: { order, group: order.fulfillment.groups[0] },
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

function carrierTrigger() {
  const trigger = document.body.querySelector('[data-testid="shipment-carrier-select"]');
  expect(trigger).toBeDefined();
  return trigger as HTMLButtonElement;
}

function formGroup(testId: string) {
  const group = document.body.querySelector(`[data-testid="${testId}"]`);
  expect(group).not.toBeNull();
  return group as HTMLElement;
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

describe('prepare shipment dialog carrier select', () => {
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

  it('offers every carrier from the catalogue with its display name', async () => {
    await render();

    carrierTrigger().click();
    await flushPromises();

    const optionLabels = [...document.body.querySelectorAll('li')];
    expect(optionLabels.map(option => option.textContent?.trim()))
      .toEqual(expect.arrayContaining(['USPS', 'DHL', 'Other']));

    const uspsOption = optionLabels.find(option => option.textContent?.trim() === 'USPS');
    expect(uspsOption).toBeDefined();
    uspsOption!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
    await flushPromises();

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

  it('blocks a tracking number that does not match the selected carrier', async () => {
    await render();

    await chooseCarrier('USPS');
    await typeTracking('1234567890');

    expect(bodyText()).toContain('That is not a USPS tracking number. Expected 22 digits starting with 9.');
    expect(actionButton('Prepare shipment').disabled).toBe(true);

    await typeTracking('9400111899223456789012');

    expect(bodyText()).not.toContain('Tracking number does not match');
    expect(actionButton('Prepare shipment').disabled).toBe(false);

    actionButton('Prepare shipment').click();
    await flushPromises();

    expect(mutateAsync).toHaveBeenCalledWith({
      orderId: 'order-1',
      body: {
        group_id: 'group-1',
        items: [{ order_item_id: 'item-1', quantity: 2 }],
        carrier: 'usps',
        tracking_number: '9400111899223456789012',
        shipment_note: undefined,
      },
    });
  });

  it('accepts any tracking number for a non-observable carrier', async () => {
    await render();

    await chooseCarrier('Other');
    await typeTracking('anything at all');

    expect(bodyText()).not.toContain('does not match');
    expect(actionButton('Prepare shipment').disabled).toBe(false);
  });

  it('clears a typed tracking number when the carrier changes', async () => {
    await render();

    await chooseCarrier('USPS');
    await typeTracking('9400111899223456789012');

    expect(trackingInput().value).toBe('9400111899223456789012');

    await chooseCarrier('DHL');

    expect(trackingInput().value).toBe('');
    expect(carrierTrigger().textContent).toContain('DHL');
  });
});
