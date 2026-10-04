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

function buildQuote(overrides?: { shippingMinor?: number, shippingDiscountMinor?: number }): CheckoutQuoteResponse {
  const shippingMinor = overrides?.shippingMinor ?? 999;
  const shippingDiscountMinor = overrides?.shippingDiscountMinor ?? 0;

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
        shipping_discount_minor: shippingDiscountMinor,
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
  it('shows the regular merchandise total and subtracts sale and code savings once', () => {
    const text = render(buildQuote({ shippingMinor: 1400 })).text();

    // Regular merchandise = quote.subtotal_minor + sale_discount_minor = 5400.
    expect(text).toContain(formatMinorCurrency(5400, 'USD'));
    expect(text).toContain('Sale savings');
    expect(text).toContain('Code savings');
    expect(text).toContain(formatMinorCurrency(400, 'USD'));
    expect(text).toContain(formatMinorCurrency(500, 'USD'));
    // Subtotal = regular - sale - code = 4500.
    expect(text).toContain(formatMinorCurrency(4500, 'USD'));
    expect(text).toContain(formatMinorCurrency(1400, 'USD'));
    expect(text).toContain(formatMinorCurrency(5900, 'USD'));
    expect(text).not.toContain('Calculated at checkout');
  });

  it('shows a real combined zero charge without free-shipping language', () => {
    const text = render(buildQuote({ shippingMinor: 0 })).text();

    expect(text).toContain(formatMinorCurrency(5400, 'USD'));
    expect(text).toContain(formatMinorCurrency(4500, 'USD'));
    expect(text).toContain(formatMinorCurrency(0, 'USD'));
    expect(text).not.toContain('FREE');
  });

  it('defers shipping to checkout before a quote exists', () => {
    const text = render().text();

    expect(text).toContain('Calculated at checkout');
    expect(text).toContain(formatMinorCurrency(4500, 'USD'));
    expect(text).not.toContain('FREE');
  });

  it('renders free-shipping savings and keeps the net shipping charge visible', () => {
    const text = render(buildQuote({ shippingMinor: 0, shippingDiscountMinor: 1500 })).text();

    expect(text).toContain('Shipping savings');
    expect(text).toContain(formatMinorCurrency(1500, 'USD'));
    // Shipping is still shown as the accepted net charge.
    expect(text).toContain(formatMinorCurrency(0, 'USD'));
    // Sale and code are subtracted exactly once from the regular merchandise value.
    expect(text).toContain(formatMinorCurrency(5400, 'USD'));
    expect(text).toContain(formatMinorCurrency(4500, 'USD'));
    expect(text).toContain(formatMinorCurrency(4500, 'USD'));
  });
});
