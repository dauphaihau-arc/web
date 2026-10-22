import { describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { formatMinorCurrency, formatShippingEstimateRange } from '@arc/utils';
import { OrderStatuses, PaymentTypes } from '@arc/enums/order';
import { FulfillmentAggregateStatuses } from '@arc/enums/fulfillment';
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail';
import OrderDetailSlideSummary from './summary.vue';

function buildOrder(overrides: Partial<ShopOrder> = {}): ShopOrder {
  return {
    id: 'order-1',
    order_number: '1001',
    shop: { id: 'shop-1', shop_name: 'Test Shop', slug: 'test-shop' },
    customer: { email: 'buyer@example.com', full_name: 'Buyer Name' },
    payment: { type: PaymentTypes.CARD },
    status: OrderStatuses.PAID,
    products: [],
    promo_codes: [],
    fulfillment: {
      status: FulfillmentAggregateStatuses.UNFULFILLED,
      requires_reconciliation: false,
      progress: {
        ordered: 1, prepared: 0, dispatched: 0, delivered: 0, canceled: 0, outstanding: 1,
      },
      groups: [],
      legacy_shipping: {
        status: 'pending',
        updated_at: new Date(),
        to_country: 'US',
        from_countries: [],
        estimated_delivery: new Date(),
      },
    },
    shipping_address: {
      full_name: 'Buyer Name',
      address1: '123 Main St',
      city: 'New York',
      country: 'US',
      state: 'NY',
      zip: '10001',
    },
    currency: 'USD',
    subtotal_minor: 5000,
    sale_discount_minor: 400,
    discount_minor: 500,
    shipping_minor: 700,
    shipping_discount_minor: 300,
    shipping: {
      shop_id: 'shop-1',
      currency: 'USD',
      charge: {
        currency: 'USD',
        quantity: 1,
        base_unit: {
          product_id: 'product-1',
          inventory_id: 'inventory-1',
          one_item_fee_minor: 700,
        },
        base_item_fee_minor: 700,
        base_item_total_minor: 700,
        additional_items_quantity: 0,
        additional_components: [],
        additional_item_fee_minor_total: 0,
        total_minor: 700,
      },
      estimate: {
        combined_min_days: 5,
        combined_max_days: 10,
        anchor_at: '2026-10-20T00:00:00.000Z',
        earliest_delivery_date: '2026-10-30',
        latest_delivery_date: '2026-11-08',
      },
      units: [],
    },
    total_minor: 5200,
    created_at: new Date(),
    ...overrides,
  } as unknown as ShopOrder;
}

async function render(order: ShopOrder) {
  return mountSuspended(OrderDetailSlideSummary, { props: { order } });
}

describe('order detail slide summary', () => {
  it('shows sale/code savings, discounted subtotal, shipping and the delivery estimate', async () => {
    const order = buildOrder();
    const wrapper = await render(order);
    const text = wrapper.text();

    expect(text).not.toContain('Product(s) total');
    expect(text).not.toContain('Refund');

    expect(text).toContain('Sale savings:');
    expect(text).toContain(formatMinorCurrency(400, 'USD'));

    expect(text).toContain('Code savings:');
    expect(text).toContain(formatMinorCurrency(500, 'USD'));

    expect(text).toContain('Subtotal:');
    expect(text).toContain(formatMinorCurrency(4500, 'USD'));

    expect(text).toContain('Shipping');
    expect(text).not.toContain('Shipping charge');
    expect(text).toContain(formatMinorCurrency(700, 'USD'));

    const estimateLabel = formatShippingEstimateRange(order.shipping?.estimate);
    expect(estimateLabel).not.toBe('');
    expect(text).toContain(`Estimated delivery: ${estimateLabel}`);
    expect(text).not.toContain('Seller estimate, not a carrier guarantee.');

    expect(text).toContain('Shipping savings:');
    expect(text).toContain(formatMinorCurrency(300, 'USD'));

    expect(text).toContain('Total');
    expect(text).toContain(formatMinorCurrency(5200, 'USD'));

    expect(text).not.toContain('Discount:');
  });

  it('renders the estimate as a single left-aligned muted line below the shipping row', async () => {
    const order = buildOrder();
    const wrapper = await render(order);

    const estimate = wrapper.findAll('div').find(node => node.text().startsWith('Estimated delivery:'));

    expect(estimate).toBeDefined();
    expect(estimate!.text()).toBe(`Estimated delivery: ${formatShippingEstimateRange(order.shipping?.estimate)}`);
    expect(estimate!.classes()).toContain('text-text-muted');
    expect(estimate!.classes()).not.toContain('text-right');
    expect(estimate!.classes()).not.toContain('justify-between');
  });

  it('hides sale and shipping savings rows when they are zero', async () => {
    const order = buildOrder({
      sale_discount_minor: 0,
      shipping_discount_minor: 0,
    });
    const wrapper = await render(order);
    const text = wrapper.text();

    expect(text).not.toContain('Sale savings:');
    expect(text).not.toContain('Shipping savings:');
    expect(text).toContain('Code savings:');
  });
});
