import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { FulfillmentAggregateStatuses } from '@arc/enums/fulfillment';
import { formatMinorCurrency } from '@arc/utils';
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail';
import type { Carrier } from '~/domains/shop/api/carrier/contracts/carrier.contract';
import type { ShipmentRateQuote } from '~/domains/shop/api/order/contracts/order.contract';
import PrepareShipmentDialog from './prepare-shipment-dialog.vue';

const {
  mutateAsync,
  buyLabelMutateAsync,
  ratesMutateAsync,
  modalClose,
  catalogueState,
} = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  buyLabelMutateAsync: vi.fn(),
  ratesMutateAsync: vi.fn(),
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
      buyLabel: {
        mutateAsync: buyLabelMutateAsync,
        isPending: ref(false),
      },
      requestShipmentRates: {
        mutateAsync: ratesMutateAsync,
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
    code: 'vnpost', name: 'VNPOST', tracking_pattern: '^[A-Z]{2}\\d{9}VN$', tracking_hint: 'two letters, nine digits, then VN', observable: true, label_supported: true,
  },
  {
    code: 'other', name: 'Other', tracking_pattern: null, tracking_hint: null, observable: false, label_supported: false,
  },
];

const RATE_OPTIONS: ShipmentRateQuote[] = [
  {
    quote_id: 'rq_usps_standard',
    carrier: 'usps',
    service: 'standard',
    price_minor: 480,
    currency: 'USD',
    estimated_days: { min: 3, max: 5 },
    expires_at: new Date('2026-11-02T12:15:00.000Z'),
  },
  {
    quote_id: 'rq_usps_express',
    carrier: 'usps',
    service: 'express',
    price_minor: 768,
    currency: 'USD',
    estimated_days: { min: 1, max: 2 },
    expires_at: new Date('2026-11-02T12:15:00.000Z'),
  },
  {
    quote_id: 'rq_dhl_standard',
    carrier: 'dhl',
    service: 'standard',
    price_minor: 660,
    currency: 'USD',
    estimated_days: { min: 3, max: 5 },
    expires_at: new Date('2026-11-02T12:15:00.000Z'),
  },
  {
    quote_id: 'rq_dhl_express',
    carrier: 'dhl',
    service: 'express',
    price_minor: 1056,
    currency: 'USD',
    estimated_days: { min: 1, max: 2 },
    expires_at: new Date('2026-11-02T12:15:00.000Z'),
  },
  {
    quote_id: 'rq_vnpost_standard',
    carrier: 'vnpost',
    service: 'standard',
    price_minor: 320,
    currency: 'USD',
    estimated_days: { min: 3, max: 5 },
    expires_at: new Date('2026-11-02T12:15:00.000Z'),
  },
  {
    quote_id: 'rq_vnpost_express',
    carrier: 'vnpost',
    service: 'express',
    price_minor: 512,
    currency: 'USD',
    estimated_days: { min: 1, max: 2 },
    expires_at: new Date('2026-11-02T12:15:00.000Z'),
  },
];

function buildOrder(orderedQuantity = 2): ShopOrder {
  return {
    id: 'order-1',
    products: [{ id: 'item-1', title: 'Ceramic Mug' }],
    fulfillment: {
      status: FulfillmentAggregateStatuses.UNFULFILLED,
      requires_reconciliation: false,
      progress: {
        ordered: orderedQuantity,
        prepared: 0,
        dispatched: 0,
        delivered: 0,
        canceled: 0,
        outstanding: orderedQuantity,
      },
      groups: [
        {
          id: 'group-1',
          method: 'seller',
          operator: 'seller',
          provenance: 'confirmed_order',
          items: [{ order_item_id: 'item-1', quantity: orderedQuantity }],
          progress: {
            ordered: orderedQuantity,
            prepared: 0,
            dispatched: 0,
            delivered: 0,
            canceled: 0,
            outstanding: orderedQuantity,
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

async function render(orderedQuantity = 2) {
  const order = buildOrder(orderedQuantity);
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

async function chooseBuyLabel() {
  const radio = document.body.querySelector('[data-testid="shipment-method-label"]') as HTMLInputElement | null;
  expect(radio).not.toBeNull();
  radio!.click();
  await flushPromises();
}

async function typePackage(testId: string, value: string) {
  const input = document.body.querySelector(`[data-testid="${testId}"]`) as HTMLInputElement | null;
  expect(input).not.toBeNull();
  input!.value = value;
  input!.dispatchEvent(new Event('input', { bubbles: true }));
  input!.dispatchEvent(new Event('blur'));
  await flushPromises();
}

function requestRatesButton() {
  const button = document.body.querySelector('[data-testid="request-rates"]') as HTMLButtonElement | null;
  expect(button).not.toBeNull();
  return button!;
}

function rateOptionButtons() {
  return [...document.body.querySelectorAll('[data-testid="rate-option"]')] as HTMLButtonElement[];
}

function primaryRateCard() {
  return document.body.querySelector('[data-testid="primary-rate"]') as HTMLElement | null;
}

function rateOptionsToggle() {
  return document.body.querySelector('[data-testid="toggle-rate-options"]') as HTMLButtonElement | null;
}

async function toggleOtherRateOptions() {
  const toggle = rateOptionsToggle();
  expect(toggle).not.toBeNull();
  toggle!.click();
  await flushPromises();
}

function rateOptionButton(label: string) {
  const button = rateOptionButtons().find(candidate => (
    candidate.textContent?.includes(label)
  ));
  expect(button).toBeDefined();
  return button!;
}

async function requestRatesForValidPackage() {
  await chooseBuyLabel();
  await typePackage('package-weight', '800');
  await typePackage('package-length', '30');
  await typePackage('package-width', '20');
  await typePackage('package-height', '10');
  requestRatesButton().click();
  await flushPromises();
}

function quantityInput(orderItemId = 'item-1') {
  const input = document.body.querySelector(
    `[data-order-item-id="${orderItemId}"] input, input[data-order-item-id="${orderItemId}"]`,
  ) as HTMLInputElement | null;
  expect(input).not.toBeNull();
  return input!;
}

function quantityError(orderItemId = 'item-1') {
  return document.body.querySelector(
    `[data-testid="quantity-error"][data-order-item-id="${orderItemId}"]`,
  ) as HTMLElement | null;
}

async function typeQuantity(value: string) {
  const input = quantityInput();
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await flushPromises();
}

async function blurQuantity() {
  quantityInput().dispatchEvent(new Event('blur'));
  await flushPromises();
}

describe('prepare shipment dialog carrier select', () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    buyLabelMutateAsync.mockReset();
    ratesMutateAsync.mockReset();
    modalClose.mockReset();
    mutateAsync.mockResolvedValue({});
    ratesMutateAsync.mockResolvedValue({ rates: RATE_OPTIONS });
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

  it('renders the carrier tracking hint below the tracking number input', async () => {
    await render();

    expect(trackingInput().placeholder).toBe('Select a carrier first');

    await chooseCarrier('USPS');

    const hint = document.body.querySelector(
      '[data-testid="shipment-tracking-hint"]',
    ) as HTMLElement | null;
    expect(hint).not.toBeNull();
    expect(hint!.textContent).toContain('22 digits starting with 9');
    expect(
      trackingInput().compareDocumentPosition(hint!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(formGroup('shipment-tracking-number-field').textContent)
      .toContain('Tracking number');
    expect(trackingInput().placeholder).toBe('9400111899223197428490');
  });

  it('uses a carrier-specific example placeholder that stays out of the hint', async () => {
    await render();

    await chooseCarrier('VNPOST');

    expect(trackingInput().placeholder).toBe('EA123456789VN');
    expect(
      document.body.querySelector('[data-testid="shipment-tracking-hint"]')!.textContent,
    ).toContain('two letters, nine digits, then VN');
    expect(trackingInput().placeholder).not.toContain('nine digits');
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

describe('prepare shipment dialog buy-label rates', () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    buyLabelMutateAsync.mockReset();
    ratesMutateAsync.mockReset();
    modalClose.mockReset();
    mutateAsync.mockResolvedValue({});
    ratesMutateAsync.mockResolvedValue({ rates: RATE_OPTIONS });
    catalogueState.carriers = CATALOGUE;
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = '';
  });

  it('requests rates from package facts and preselects the cheapest standard option', async () => {
    await render();
    await requestRatesForValidPackage();

    expect(ratesMutateAsync).toHaveBeenCalledWith({
      orderId: 'order-1',
      body: {
        weight_grams: 800,
        length_cm: 30,
        width_cm: 20,
        height_cm: 10,
      },
    });

    const primary = primaryRateCard();
    expect(primary).not.toBeNull();
    expect(primary!.textContent).toContain('VNPOST — Standard');
    expect(primary!.textContent).toContain(formatMinorCurrency(320, 'USD'));
    expect(primary!.textContent).toContain('3–5 days');
    expect(primary!.textContent).toContain('Cheapest');
    expect(primary!.textContent).not.toContain('Fastest');

    expect(rateOptionsToggle()!.textContent).toContain('Show 5 other options');
    expect(rateOptionButtons()).toHaveLength(0);
    expect(actionButton('Buy label').disabled).toBe(false);

    await toggleOtherRateOptions();

    expect(rateOptionButtons()).toHaveLength(6);

    expect(bodyText()).toContain('USPS — Standard');
    expect(bodyText()).toContain('USPS — Express');
    expect(bodyText()).toContain('DHL — Standard');
    expect(bodyText()).toContain('DHL — Express');
    expect(bodyText()).toContain('VNPOST — Express');

    expect(bodyText()).toContain(formatMinorCurrency(480, 'USD'));
    expect(bodyText()).toContain(formatMinorCurrency(1056, 'USD'));
    expect(bodyText()).toContain('1–2 days');
  });

  it('lists the other options by price with the fastest option tagged', async () => {
    await render();
    await requestRatesForValidPackage();
    await toggleOtherRateOptions();

    const labels = rateOptionButtons()
      .map(button => button.textContent?.replace(/\s+/g, ' ').trim() ?? '');

    expect(labels.map(label => label.split(' ')[0])).toEqual([
      'VNPOST',
      'USPS',
      'VNPOST',
      'DHL',
      'USPS',
      'DHL',
    ]);

    const fastest = rateOptionButton('VNPOST — Express');
    expect(fastest.textContent).toContain('Fastest');
    expect(fastest.textContent).not.toContain('Cheapest');
    expect(rateOptionButton('USPS — Standard').textContent).not.toContain('Fastest');
  });

  it('marks a chosen option active in the list without swapping rows', async () => {
    await render();
    await requestRatesForValidPackage();
    await toggleOtherRateOptions();

    rateOptionButton('DHL — Express').click();
    await flushPromises();

    // The list stays open and in its price order; only the active row changes.
    expect(primaryRateCard()).toBeNull();
    expect(rateOptionButtons()).toHaveLength(6);

    const dhlExpress = rateOptionButton('DHL — Express');
    expect(dhlExpress.textContent).toContain(formatMinorCurrency(1056, 'USD'));
    expect(dhlExpress.getAttribute('aria-pressed')).toBe('true');
    expect(rateOptionButton('VNPOST — Standard').textContent).toContain('Cheapest');

    expect(mutateAsync).not.toHaveBeenCalled();
    expect(
      [...document.body.querySelectorAll('button')]
        .some(button => button.textContent?.includes('Prepare shipment')),
    ).toBe(false);

    actionButton('Buy label').click();
    await flushPromises();

    expect(buyLabelMutateAsync).toHaveBeenCalledWith({
      orderId: 'order-1',
      body: {
        quote_id: 'rq_dhl_express',
        group_id: 'group-1',
        items: [{ order_item_id: 'item-1', quantity: 2 }],
      },
    });
    expect(mutateAsync).not.toHaveBeenCalled();

    await toggleOtherRateOptions();
    expect(primaryRateCard()!.textContent).toContain('DHL — Express');
  });

  it('collapses the other options again', async () => {
    await render();
    await requestRatesForValidPackage();
    await toggleOtherRateOptions();
    expect(rateOptionButtons()).toHaveLength(6);

    await toggleOtherRateOptions();

    expect(rateOptionButtons()).toHaveLength(0);
    expect(rateOptionsToggle()!.textContent).toContain('Show 5 other options');
  });

  it('clears quoted rates when the package facts change', async () => {
    await render();
    await requestRatesForValidPackage();
    expect(primaryRateCard()).not.toBeNull();

    await typePackage('package-weight', '900');

    expect(rateOptionButtons()).toHaveLength(0);
    expect(primaryRateCard()).toBeNull();
    expect(rateOptionsToggle()).toBeNull();
  });

  it('disables the rate request until every package fact is a positive whole number', async () => {
    await render();
    await chooseBuyLabel();

    expect(requestRatesButton().disabled).toBe(true);

    await typePackage('package-weight', '0');
    await typePackage('package-length', '30');
    await typePackage('package-width', '20');
    await typePackage('package-height', '10');

    expect(requestRatesButton().disabled).toBe(true);
    expect(bodyText()).toContain('Enter a whole number of grams from 1 to 100,000.');

    requestRatesButton().click();
    await flushPromises();

    expect(ratesMutateAsync).not.toHaveBeenCalled();
    expect(rateOptionButtons()).toHaveLength(0);

    await typePackage('package-weight', '800');

    expect(requestRatesButton().disabled).toBe(false);
  });

  it('surfaces a rate request failure inside the dialog', async () => {
    ratesMutateAsync.mockRejectedValue({
      data: {
        code: 'CARRIER_RATES_UNAVAILABLE',
        message: 'Shipping rates are temporarily unavailable',
      },
    });

    await render();
    await requestRatesForValidPackage();

    const error = document.body.querySelector('[data-testid="rates-error"]');
    expect(error).not.toBeNull();
    expect(error!.textContent).toContain('Shipping rates are temporarily unavailable');
    expect(rateOptionButtons()).toHaveLength(0);
  });

  it('buys the preselected rate for the chosen quantities and closes the dialog', async () => {
    buyLabelMutateAsync.mockResolvedValue({ label: { label_id: 'lbl_1' } });

    await render();
    await requestRatesForValidPackage();

    expect(actionButton('Buy label').disabled).toBe(false);
    actionButton('Buy label').click();
    await flushPromises();

    expect(buyLabelMutateAsync).toHaveBeenCalledWith({
      orderId: 'order-1',
      body: {
        quote_id: 'rq_vnpost_standard',
        group_id: 'group-1',
        items: [{ order_item_id: 'item-1', quantity: 2 }],
      },
    });
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(modalClose).toHaveBeenCalled();
  });

  it('asks for fresh rates when the selected quote expired and clears the stale options', async () => {
    buyLabelMutateAsync.mockRejectedValue({
      data: {
        code: 'RATE_QUOTE_EXPIRED',
        message: 'This shipping rate quote has expired',
      },
    });

    await render();
    await requestRatesForValidPackage();

    actionButton('Buy label').click();
    await flushPromises();

    const error = document.body.querySelector('[data-testid="label-purchase-error"]');
    expect(error).not.toBeNull();
    expect(error!.textContent).toContain('Get rates again');
    expect(rateOptionButtons()).toHaveLength(0);
    expect(primaryRateCard()).toBeNull();
    expect(rateOptionsToggle()).toBeNull();
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(modalClose).not.toHaveBeenCalled();
  });
});

describe('prepare shipment dialog quantity limits', () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    buyLabelMutateAsync.mockReset();
    ratesMutateAsync.mockReset();
    modalClose.mockReset();
    mutateAsync.mockResolvedValue({});
    buyLabelMutateAsync.mockResolvedValue({ label: { label_id: 'lbl_1' } });
    ratesMutateAsync.mockResolvedValue({ rates: RATE_OPTIONS });
    catalogueState.carriers = CATALOGUE;
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = '';
  });

  it('keeps the row hint and starts from the remaining capacity', async () => {
    await render(1);

    expect(bodyText()).toContain('1 remaining');
    expect(quantityInput().value).toBe('1');
    expect(quantityError()).toBeNull();
    expect(actionButton('Prepare shipment').disabled).toBe(false);
  });

  it('names the remaining capacity and blocks preparing above it', async () => {
    await render(1);

    await typeQuantity('1331');

    expect(quantityError()?.textContent).toContain('Only 1 remaining.');
    expect(actionButton('Prepare shipment').disabled).toBe(true);

    actionButton('Prepare shipment').click();
    await flushPromises();

    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('asks for a whole number when the field is emptied', async () => {
    await render(1);

    await typeQuantity('');

    expect(quantityError()?.textContent).toContain('Enter a whole number between 0 and 1.');
    expect(actionButton('Prepare shipment').disabled).toBe(true);
  });

  it('clamps on blur, clears the error and ships the clamped quantity', async () => {
    await render(1);

    await typeQuantity('1331');
    await blurQuantity();

    expect(quantityInput().value).toBe('1');
    expect(quantityError()).toBeNull();
    expect(actionButton('Prepare shipment').disabled).toBe(false);

    actionButton('Prepare shipment').click();
    await flushPromises();

    expect(mutateAsync).toHaveBeenCalledWith({
      orderId: 'order-1',
      body: {
        group_id: 'group-1',
        items: [{ order_item_id: 'item-1', quantity: 1 }],
        carrier: undefined,
        tracking_number: undefined,
        shipment_note: undefined,
      },
    });
  });

  it('clamps a negative entry to nothing on blur and stops the request', async () => {
    await render(1);

    await typeQuantity('-3');

    expect(quantityError()?.textContent).toContain('Enter a whole number between 0 and 1.');
    expect(actionButton('Prepare shipment').disabled).toBe(true);

    await blurQuantity();

    expect(quantityInput().value).toBe('0');
    expect(quantityError()).toBeNull();
    expect(actionButton('Prepare shipment').disabled).toBe(true);
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('disables buying a label while the typed quantity is out of range', async () => {
    await render(1);
    await requestRatesForValidPackage();

    expect(actionButton('Buy label').disabled).toBe(false);

    await typeQuantity('1331');

    expect(quantityError()?.textContent).toContain('Only 1 remaining.');
    expect(actionButton('Buy label').disabled).toBe(true);

    actionButton('Buy label').click();
    await flushPromises();

    expect(buyLabelMutateAsync).not.toHaveBeenCalled();

    await blurQuantity();

    expect(quantityError()).toBeNull();
    expect(actionButton('Buy label').disabled).toBe(false);

    actionButton('Buy label').click();
    await flushPromises();

    expect(buyLabelMutateAsync).toHaveBeenCalledWith({
      orderId: 'order-1',
      body: {
        quote_id: 'rq_vnpost_standard',
        group_id: 'group-1',
        items: [{ order_item_id: 'item-1', quantity: 1 }],
      },
    });
  });
});
