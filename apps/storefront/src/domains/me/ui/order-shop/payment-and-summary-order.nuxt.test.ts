import { formatMinorCurrency } from '@arc/utils';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import type { GetOrderShopsResponse } from '~/domains/me/api/order/contracts/order.contract';
import PaymentAndSummaryOrder from './payment-and-summary-order.vue';

type OrderShop = GetOrderShopsResponse['order_shops'][number];

const SHOP_ID = '00000000-0000-4000-8000-000000000001';

function buildOrderShop(overrides?: Partial<OrderShop>): OrderShop {
  return {
    id: 'order-1',
    order_number: 'ORD-1',
    shop: { id: SHOP_ID, shop_name: 'Ceramics Studio', slug: 'ceramics-studio' },
    payment: { type: 'card', card_brand: 'visa', card_last4: 1234 },
    status: 'paid',
    products: [],
    promo_coupons: [],
    fulfillment: {
      status: 'unfulfilled',
      requires_reconciliation: false,
      progress: {
        ordered: 0,
        prepared: 0,
        dispatched: 0,
        delivered: 0,
        canceled: 0,
        outstanding: 0,
      },
      groups: [],
      legacy_shipping: {
        status: 'pre_transit',
        updated_at: new Date('2026-02-01T00:00:00.000Z'),
        to_country: 'US',
        from_countries: ['US'],
        estimated_delivery: new Date('2026-02-10T00:00:00.000Z'),
      },
    },
    currency: 'USD',
    subtotal_minor: 4500,
    sale_discount_minor: 400,
    discount_minor: 300,
    shipping_minor: 999,
    shipping_discount_minor: 250,
    total_minor: 5199,
    created_at: new Date('2026-02-01T00:00:00.000Z'),
    ...overrides,
  } as unknown as OrderShop;
}

async function renderCollapsed(orderShop: OrderShop) {
  const wrapper = await mountSuspended(PaymentAndSummaryOrder, { props: { orderShop } });
  await wrapper.get('button').trigger('click');
  return wrapper;
}

describe('payment and summary order', () => {
  it('shows sale savings, code savings and shipping savings separately and derives subtotal without double-counting', async () => {
    const wrapper = await renderCollapsed(buildOrderShop());
    const text = wrapper.text();

    expect(text).toContain('Product(s) total');
    expect(text).toContain('Sale savings');
    expect(text).toContain('Code savings');
    expect(text).toContain('Subtotal');
    expect(text).toContain('Shipping');
    expect(text).toContain('Shipping savings');
    expect(text).toContain('Total');

    // Regular merchandise value = subtotal_minor + sale_discount_minor
    expect(text).toContain(formatMinorCurrency(4900, 'USD'));
    // Sale savings
    expect(text).toContain(formatMinorCurrency(400, 'USD'));
    // Code savings
    expect(text).toContain(formatMinorCurrency(300, 'USD'));
    // Subtotal = regular - sale_discount - discount_minor, no double-counting
    expect(text).toContain(formatMinorCurrency(4200, 'USD'));
    // Shipping net charge and informational shipping savings
    expect(text).toContain(formatMinorCurrency(999, 'USD'));
    expect(text).toContain(formatMinorCurrency(250, 'USD'));
    // Total is the accepted order total, never re-derived
    expect(text).toContain(formatMinorCurrency(5199, 'USD'));
  });
});
