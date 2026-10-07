import { formatMinorCurrency, formatShippingEstimateRange } from '@arc/utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { CartShopGroup } from '~/domains/cart/api/cart.shared';
import type { CheckoutQuoteShop } from '~/domains/me/api/order/contracts/order.contract';
import CheckoutShopSummary from './checkout-shop-summary.vue';

const SHOP_ID = '00000000-0000-4000-8000-000000000001';

function buildShopCart(overrides?: Partial<CartShopGroup>): CartShopGroup {
  return {
    shop: { id: SHOP_ID, name: 'Ceramics Studio' },
    items: [],
    currency: 'USD',
    total_minor: 2500,
    discount_minor: 0,
    sale_discount_minor: 0,
    shipping_minor: 0,
    ...overrides,
  };
}

const ESTIMATE = {
  earliest_delivery_date: '2026-08-12T00:00:00.000Z',
  latest_delivery_date: '2026-08-15T00:00:00.000Z',
};

function buildQuoteShop(overrides?: {
  shippingMinor?: number
  shippingDiscountMinor?: number
  discountMinor?: number
}): CheckoutQuoteShop {
  const shippingMinor = overrides?.shippingMinor ?? 999;
  const shippingDiscountMinor = overrides?.shippingDiscountMinor ?? 0;
  const discountMinor = overrides?.discountMinor ?? 300;

  return {
    shop_id: SHOP_ID,
    shop_name: 'Ceramics Studio',
    shop_slug: 'ceramics-studio',
    subtotal_minor: 2500,
    sale_discount_minor: 400,
    discount_minor: discountMinor,
    shipping_minor: shippingMinor,
    shipping_discount_minor: shippingDiscountMinor,
    total_minor: 2500 - discountMinor + shippingMinor,
    promo_codes: [],
    origin_countries: ['US'],
    shipping: { shop_id: SHOP_ID, currency: 'USD', estimate: ESTIMATE },
  } as unknown as CheckoutQuoteShop;
}

function render(
  quoteShop?: CheckoutQuoteShop,
  checkoutCurrency?: string,
  shopCart = buildShopCart(),
) {
  return mount(CheckoutShopSummary, {
    props: { shopCart, quoteShop, checkoutCurrency },
  });
}

describe('checkout shop summary', () => {
  it('shows the accepted per-shop merchandise, code saving, shipping, and total', () => {
    const text = render(buildQuoteShop()).text();

    expect(text).toContain('Product(s) total');
    expect(text).toContain('Code savings');
    expect(text).toContain('Shipping');
    expect(text).toContain(formatMinorCurrency(2500, 'USD'));
    expect(text).toContain(formatMinorCurrency(300, 'USD'));
    expect(text).toContain(formatMinorCurrency(999, 'USD'));
    // Merchandise - code saving + shipping = accepted total.
    expect(text).toContain(formatMinorCurrency(3199, 'USD'));
    expect(text).toContain(`Estimated delivery: ${formatShippingEstimateRange(ESTIMATE)}`);
    // No sale breakdown, estimate placeholder, or pending placeholder.
    expect(text).not.toContain('Sale savings');
    expect(text).not.toContain('Shipping savings');
    expect(text).not.toContain('Subtotal');
    expect(text).not.toContain('Calculating...');
    expect(text).not.toContain('Calculated at checkout');
  });

  it('carries the waived shipping amount as a savings row', () => {
    const text = render(buildQuoteShop({ shippingDiscountMinor: 200 })).text();

    expect(text).toContain('Shipping savings');
    expect(text).toContain(formatMinorCurrency(200, 'USD'));
  });

  it('shows only the total when the shop carries no code saving', () => {
    const text = render(buildQuoteShop({ discountMinor: 0 })).text();

    expect(text).toContain('Total');
    expect(text).not.toContain('Product(s) total');
    expect(text).not.toContain('Code savings');
  });

  it('falls back to the cart merchandise net of its code saving before a quote exists', () => {
    const text = render(undefined, undefined, buildShopCart({ discount_minor: 500 })).text();

    expect(text).toContain('Product(s) total');
    expect(text).toContain('Code savings');
    expect(text).toContain(formatMinorCurrency(2500, 'USD'));
    expect(text).toContain(formatMinorCurrency(500, 'USD'));
    // Total = 2500 - 500; the saving is not subtracted twice.
    expect(text).toContain(formatMinorCurrency(2000, 'USD'));
    // The cart is merchandise-only: no accepted charge or estimate to show.
    expect(text).not.toContain('Shipping');
    expect(text).not.toContain('Estimated delivery');
  });

  it('formats every amount in the accepted checkout currency', () => {
    const text = render(buildQuoteShop({ shippingMinor: 215646 }), 'VND').text();

    expect(text).toContain(formatMinorCurrency(2500, 'VND'));
    expect(text).toContain(formatMinorCurrency(300, 'VND'));
    expect(text).toContain(formatMinorCurrency(215646, 'VND'));
    expect(text).toContain(formatMinorCurrency(217846, 'VND'));
    expect(text).not.toContain(formatMinorCurrency(2500, 'USD'));
  });

  it('never exposes internal shop identifiers', () => {
    expect(render(buildQuoteShop()).text()).not.toContain(SHOP_ID);
  });
});
