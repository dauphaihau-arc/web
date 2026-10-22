import { describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { formatMinorCurrency } from '@arc/utils';
import { OrderStatuses, PaymentTypes } from '@arc/enums/order';
import { FulfillmentAggregateStatuses } from '@arc/enums/fulfillment';
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail';
import OrderSummary from './order-summary.vue';

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
    total_minor: 5200,
    created_at: new Date(),
    ...overrides,
  } as unknown as ShopOrder;
}

async function render(order: ShopOrder) {
  return mountSuspended(OrderSummary, { props: { order } });
}

describe('order detail content order summary', () => {
  it('shows sale/code savings, discounted subtotal and shipping savings without refund or product total rows', async () => {
    const order = buildOrder();
    const wrapper = await render(order);
    const text = wrapper.text();

    expect(text).not.toContain('Product(s) total');
    expect(text).not.toContain('Refund');

    expect(text).toContain('Sale savings');
    expect(text).toContain(formatMinorCurrency(400, 'USD'));

    expect(text).toContain('Code savings');
    expect(text).toContain(formatMinorCurrency(500, 'USD'));

    expect(text).toContain('Subtotal');
    expect(text).toContain(formatMinorCurrency(4500, 'USD'));

    expect(text).not.toContain('Shipping charge');
    expect(text).toContain(formatMinorCurrency(700, 'USD'));

    expect(text).toContain('Shipping savings');
    expect(text).toContain(formatMinorCurrency(300, 'USD'));

    expect(text).toContain('Total');
    expect(text).toContain(formatMinorCurrency(5200, 'USD'));

    expect(text).not.toContain('Platform commission');
    expect(text).not.toContain('Net earnings');

    expect(text).not.toContain('Discount');
  });

  it('shows the platform commission as a deduction and nets it out of the total', async () => {
    const order = buildOrder({ platform_commission_minor: 520 });
    const wrapper = await render(order);
    const text = wrapper.text();

    expect(text).toContain('Platform commission');
    expect(text).toContain(`-${formatMinorCurrency(520, 'USD')}`);

    expect(text).toContain('Net earnings');
    expect(text).toContain(formatMinorCurrency(4680, 'USD'));
    expect(text).not.toContain(formatMinorCurrency(5200, 'USD'));
  });

  it('keeps the total label when the commission is null or zero', async () => {
    for (const commission of [null, 0]) {
      const wrapper = await render(buildOrder({ platform_commission_minor: commission }));
      const text = wrapper.text();

      expect(text).not.toContain('Platform commission');
      expect(text).not.toContain('Net earnings');
      expect(text).toContain('Total');
      expect(text).toContain(formatMinorCurrency(5200, 'USD'));
    }
  });

  it('hides sale and shipping savings rows when they are zero', async () => {
    const order = buildOrder({
      sale_discount_minor: 0,
      shipping_discount_minor: 0,
    });
    const wrapper = await render(order);
    const text = wrapper.text();

    expect(text).not.toContain('Sale savings');
    expect(text).not.toContain('Shipping savings');
    expect(text).toContain('Code savings');
  });
});
