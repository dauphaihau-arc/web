import {
  afterEach, describe, expect, it, vi,
} from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import {
  ShipmentLabelStatuses,
  ShipmentStatuses,
  ShipmentUpdateActorTypes,
  ShipmentUpdateSources,
} from '@arc/enums/fulfillment';
import { OrderStatuses } from '@arc/enums/order';
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail';
import CanceledLabelRefunds from './canceled-label-refunds.vue';

const {
  refundLabelMutate, refundLabelPending,
} = vi.hoisted(() => ({
  refundLabelMutate: vi.fn(),
  refundLabelPending: { value: false },
}));

vi.mock('~/domains/shop/mutations/order-fulfillment.mutation', async () => {
  const { ref: vueRef } = await import('vue');

  return {
    useShopOrderFulfillmentMutations: () => ({
      refundLabel: {
        mutateAsync: refundLabelMutate,
        isPending: vueRef(refundLabelPending.value),
      },
    }),
  };
});

type Shipment = ShopOrder['fulfillment']['groups'][number]['shipments'][number];

function buildShipment(input: {
  id?: string
  label?: Shipment['label']
  updates?: Shipment['updates']
} = {}): Shipment {
  return {
    id: input.id ?? 'shipment-1',
    group_id: 'group-1',
    status: ShipmentStatuses.PREPARED,
    carrier: 'usps',
    carrier_name: 'USPS',
    origin_countries: ['US'],
    prepared_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    items: [{ order_item_id: 'item-1', quantity: 1 }],
    label: input.label === undefined
      ? {
        public_id: 'label-1',
        service: 'standard',
        status: ShipmentLabelStatuses.PURCHASED,
        price_minor: 1250,
        currency: 'USD',
      }
      : input.label,
    updates: input.updates ?? [],
  } as unknown as Shipment;
}

function buildOrder(
  status: OrderStatuses,
  shipments: Shipment[] = [buildShipment()],
): ShopOrder {
  return {
    id: 'order-1',
    status,
    products: [{ id: 'item-1', title: 'Ceramic Mug' }],
    fulfillment: {
      status: 'canceled',
      requires_reconciliation: false,
      progress: {
        ordered: 1, prepared: 0, dispatched: 0, delivered: 0, canceled: 1, outstanding: 0,
      },
      groups: [
        {
          id: 'group-1',
          method: 'seller',
          operator: 'seller',
          provenance: 'confirmed_order',
          items: [{ order_item_id: 'item-1', quantity: 1 }],
          progress: {
            ordered: 1, prepared: 0, dispatched: 0, delivered: 0, canceled: 1, outstanding: 0,
          },
          shipments,
        },
      ],
    },
  } as unknown as ShopOrder;
}

let wrapper: VueWrapper | undefined;

async function render(order: ShopOrder) {
  wrapper = await mountSuspended(CanceledLabelRefunds, { props: { order } });
  await flushPromises();

  return wrapper;
}

describe('canceled label refunds banner', () => {
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    refundLabelMutate.mockReset();
    refundLabelPending.value = false;
  });

  it('shows the unused label on a canceled order', async () => {
    const text = (await render(buildOrder(OrderStatuses.CANCELED))).text();

    expect(text).toContain('Unused label');
    expect(text).toContain('USPS');
    expect(text).toContain('standard');
    expect(text).toContain('$12.50');
  });

  it('renders nothing when no label is refundable', async () => {
    const canceledWithoutLabel = await render(
      buildOrder(OrderStatuses.CANCELED, [buildShipment({ label: null })]),
    );

    expect(canceledWithoutLabel.find('[data-testid="canceled-label-refunds"]').exists()).toBe(false);
    canceledWithoutLabel.unmount();
    wrapper = undefined;

    const activeOrder = await render(buildOrder(OrderStatuses.PAID));

    expect(activeOrder.find('[data-testid="canceled-label-refunds"]').exists()).toBe(false);
    activeOrder.unmount();
    wrapper = undefined;

    const scannedLabel = await render(buildOrder(OrderStatuses.CANCELED, [
      buildShipment({
        updates: [{
          id: 'update-1',
          status: ShipmentStatuses.IN_TRANSIT,
          actor_type: ShipmentUpdateActorTypes.CARRIER,
          source: ShipmentUpdateSources.CARRIER,
          occurred_at: new Date(),
        }] as unknown as Shipment['updates'],
      }),
    ]));

    expect(scannedLabel.find('[data-testid="canceled-label-refunds"]').exists()).toBe(false);
  });

  it('refunds the label after confirmation', async () => {
    refundLabelMutate.mockResolvedValue({});
    const mounted = await render(buildOrder(OrderStatuses.CANCELED));

    await mounted.get('[data-testid="refund-label"]').trigger('click');
    await flushPromises();

    expect(mounted.find('[data-testid="refund-label-confirm"]').exists()).toBe(true);
    expect(refundLabelMutate).not.toHaveBeenCalled();

    await mounted.get('[data-testid="refund-label-confirm"]').trigger('click');
    await flushPromises();

    expect(refundLabelMutate).toHaveBeenCalledWith({
      orderId: 'order-1',
      shipmentId: 'shipment-1',
    });
  });

  it('disables the actions while the refund is pending', async () => {
    refundLabelPending.value = true;
    const mounted = await render(buildOrder(OrderStatuses.CANCELED));

    const refundButton = mounted.get('[data-testid="refund-label"]');
    expect(refundButton.attributes('disabled')).toBeDefined();
  });

  it('shows the API message when the refund fails', async () => {
    refundLabelMutate.mockRejectedValue({
      data: { code: 'SHIPMENT_LABEL_ALREADY_USED', message: 'This label was already scanned and cannot be refunded' },
    });
    const mounted = await render(buildOrder(OrderStatuses.CANCELED));

    await mounted.get('[data-testid="refund-label"]').trigger('click');
    await mounted.get('[data-testid="refund-label-confirm"]').trigger('click');
    await flushPromises();

    expect(mounted.get('[data-testid="refund-label-error"]').text())
      .toContain('This label was already scanned and cannot be refunded');
  });
});
