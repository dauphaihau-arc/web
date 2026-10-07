import { formatMinorCurrency } from '@arc/utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { CartSummary } from '~/domains/cart/api/cart.shared';
import type { CheckoutQuoteResponse } from '~/domains/me/api/order/contracts/order.contract';
import SummaryOrderCard from './summary-order-card.vue';

const SHOP_ID = '00000000-0000-4000-8000-000000000001';

function buildSummary(overrides?: Partial<CartSummary>): CartSummary {
  return {
    currency: 'USD',
    subtotal_minor: 5000,
    discount_minor: 500,
    subtotal_after_discount_minor: 4500,
    shipping_minor: 0,
    total_minor: 4500,
    total_selected_quantity: 2,
    total_quantity: 2,
    ...overrides,
  };
}

function buildQuote(overrides?: { shippingMinor?: number, discountMinor?: number }): CheckoutQuoteResponse {
  const shippingMinor = overrides?.shippingMinor ?? 999;
  const discountMinor = overrides?.discountMinor ?? 500;

  return {
    quote_id: 'quote-1',
    checkout_currency: 'USD',
    subtotal_minor: 5000,
    shipping_minor: shippingMinor,
    sale_discount_minor: 400,
    discount_minor: discountMinor,
    total_minor: 5000 - discountMinor + shippingMinor,
    shops: [
      {
        shop_id: SHOP_ID,
        shop_name: 'Ceramics Studio',
        shop_slug: 'ceramics-studio',
        subtotal_minor: 5000,
        sale_discount_minor: 400,
        discount_minor: discountMinor,
        shipping_minor: shippingMinor,
        shipping_discount_minor: 0,
        total_minor: 5000 - discountMinor + shippingMinor,
        promo_codes: [],
        origin_countries: ['US'],
      },
    ],
    expires_at: new Date('2026-09-22T00:15:00.000Z'),
    items: [],
  } as unknown as CheckoutQuoteResponse;
}

function render(quote?: CheckoutQuoteResponse, summaryOrder = buildSummary()) {
  return mount(SummaryOrderCard, {
    props: { loading: false, summaryOrder, quote },
  });
}

describe('summary order card', () => {
  it('shows the accepted basket merchandise, code saving, shipping, and total', () => {
    const text = render(buildQuote({ shippingMinor: 1400 })).text();

    expect(text).toContain('2 products');
    expect(text).toContain('Product(s) total');
    expect(text).toContain('Code savings');
    expect(text).toContain('Shipping');
    expect(text).toContain(formatMinorCurrency(5000, 'USD'));
    expect(text).toContain(formatMinorCurrency(500, 'USD'));
    expect(text).toContain(formatMinorCurrency(1400, 'USD'));
    // Merchandise - code saving + shipping = accepted total.
    expect(text).toContain(formatMinorCurrency(5900, 'USD'));
    // No sale breakdown or pending placeholder in the review.
    expect(text).not.toContain('Sale savings');
    expect(text).not.toContain('Shipping savings');
    expect(text).not.toContain('Subtotal');
    expect(text).not.toContain('Calculated at checkout');
  });

  it('sums the per-shop waived amounts into one shipping savings row', () => {
    const quote = buildQuote();
    quote.shops[0]!.shipping_discount_minor = 250;
    const text = render(quote).text();

    expect(text).toContain('Shipping savings');
    expect(text).toContain(formatMinorCurrency(250, 'USD'));
  });

  it('shows only the aggregate total when the basket carries no code saving', () => {
    const text = render(undefined, buildSummary({
      subtotal_minor: 4500,
      discount_minor: 0,
      subtotal_after_discount_minor: 4500,
    })).text();

    expect(text).toContain('2 products');
    expect(text).toContain(formatMinorCurrency(4500, 'USD'));
    expect(text).not.toContain('Product(s) total');
    expect(text).not.toContain('Code savings');
    expect(text).not.toContain('Shipping');
  });

  it('mirrors the cart merchandise and savings before a quote exists', () => {
    const text = render().text();

    expect(text).toContain('2 products');
    expect(text).toContain('Product(s) total');
    expect(text).toContain('Code savings');
    expect(text).toContain(formatMinorCurrency(5000, 'USD'));
    expect(text).toContain(formatMinorCurrency(500, 'USD'));
    expect(text).toContain(formatMinorCurrency(4500, 'USD'));
    expect(text).not.toContain('Shipping');
  });

  it('formats accepted money in the checkout currency', () => {
    const quote = { ...buildQuote(), checkout_currency: 'VND' } as CheckoutQuoteResponse;
    const text = render(quote).text();

    expect(text).toContain(formatMinorCurrency(5000, 'VND'));
    expect(text).not.toContain(formatMinorCurrency(5000, 'USD'));
  });
});
