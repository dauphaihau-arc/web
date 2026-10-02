import { formatMinorCurrency } from '@arc/utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { CartSummary } from '~/domains/cart/api/cart.shared';
import type { CheckoutQuoteResponse } from '~/domains/me/api/order/contracts/order.contract';
import SummaryOrderCard from './summary-order-card.vue';

const SHOP_ID = '00000000-0000-4000-8000-000000000001';

function buildSummary(): CartSummary {
  return {
    currency: 'USD',
    subtotal_minor: 5000,
    discount_minor: 500,
    subtotal_after_discount_minor: 4500,
    shipping_minor: 0,
    total_minor: 4500,
    total_selected_quantity: 2,
    total_quantity: 2,
  };
}

function buildQuote(shippingMinor: number): CheckoutQuoteResponse {
  return {
    quote_id: 'quote-1',
    checkout_currency: 'USD',
    subtotal_minor: 5000,
    shipping_minor: shippingMinor,
    sale_discount_minor: 400,
    discount_minor: 500,
    total_minor: 4500 + shippingMinor,
    shops: [
      {
        shop_id: SHOP_ID,
        shop_name: 'Ceramics Studio',
        shop_slug: 'ceramics-studio',
        subtotal_minor: 5000,
        sale_discount_minor: 400,
        discount_minor: 500,
        shipping_minor: shippingMinor,
        total_minor: 4500 + shippingMinor,
        promo_codes: [],
        origin_countries: ['US'],
      },
    ],
    expires_at: new Date('2026-09-22T00:15:00.000Z'),
    items: [],
  } as unknown as CheckoutQuoteResponse;
}

function render(quote?: CheckoutQuoteResponse) {
  return mount(SummaryOrderCard, {
    props: { loading: false, summaryOrder: buildSummary(), quote },
  });
}

describe('summary order card', () => {
  it('shows the combined checkout shipping total and total from the accepted quote', () => {
    const text = render(buildQuote(1400)).text();

    expect(text).toContain('Sale savings');
    expect(text).toContain('Code savings');
    expect(text).toContain(formatMinorCurrency(400, 'USD'));
    expect(text).toContain(formatMinorCurrency(500, 'USD'));
    expect(text).toContain(formatMinorCurrency(1400, 'USD'));
    expect(text).toContain(formatMinorCurrency(5900, 'USD'));
    expect(text).not.toContain('Calculated at checkout');
  });

  it('shows a real combined zero charge without free-shipping language', () => {
    const text = render(buildQuote(0)).text();

    expect(text).toContain(formatMinorCurrency(0, 'USD'));
    expect(text).not.toContain('FREE');
  });

  it('defers shipping to checkout before a quote exists', () => {
    const text = render().text();

    expect(text).toContain('Calculated at checkout');
    expect(text).toContain(formatMinorCurrency(4500, 'USD'));
    expect(text).not.toContain('FREE');
  });
});
