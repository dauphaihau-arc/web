import { formatMinorCurrency } from '@arc/utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { CartShopGroup } from '~/domains/cart/api/cart.shared';
import type { CheckoutQuoteShop } from '~/domains/me/api/order/contracts/order.contract';
import CheckoutShopSummary from './checkout-shop-summary.vue';

const SHOP_ID = '00000000-0000-4000-8000-000000000001';

function buildShopCart(): CartShopGroup {
  return {
    shop: { id: SHOP_ID, name: 'Ceramics Studio' },
    items: [],
    currency: 'USD',
    total_minor: 2500,
    discount_minor: 0,
    sale_discount_minor: 0,
    shipping_minor: 0,
  };
}

function buildQuoteShop(overrides?: { shippingMinor?: number, shippingDiscountMinor?: number }): CheckoutQuoteShop {
  const shippingMinor = overrides?.shippingMinor ?? 999;
  const shippingDiscountMinor = overrides?.shippingDiscountMinor ?? 0;

  return {
    shop_id: SHOP_ID,
    shop_name: 'Ceramics Studio',
    shop_slug: 'ceramics-studio',
    subtotal_minor: 2500,
    sale_discount_minor: 400,
    discount_minor: 300,
    shipping_minor: shippingMinor,
    shipping_discount_minor: shippingDiscountMinor,
    total_minor: 2500 - 300 + shippingMinor,
    promo_codes: [],
    origin_countries: ['US'],
    shipping: {
      shop_id: SHOP_ID,
      currency: 'USD',
      estimate: {
        earliest_delivery_date: '2026-09-26T00:00:00.000Z',
        latest_delivery_date: '2026-09-30T00:00:00.000Z',
      },
    },
  } as unknown as CheckoutQuoteShop;
}

function render(quoteShop?: CheckoutQuoteShop, isPending = false, checkoutCurrency?: string) {
  return mount(CheckoutShopSummary, {
    props: {
      shopCart: buildShopCart(), quoteShop, isPending, checkoutCurrency,
    },
  });
}

describe('checkout shop summary', () => {
  it('shows the per-shop sale and code savings, shipping, and total', () => {
    const text = render(buildQuoteShop()).text();

    expect(text).toContain('Product(s) total');
    expect(text).toContain('Sale savings');
    expect(text).toContain('Code savings');
    expect(text).toContain('Subtotal');
    expect(text).toContain('Shipping');
    expect(text).toContain('Total');
  });

  it('renders the accepted per-shop money, Shipping Charge, and seller estimate', () => {
    const text = render(buildQuoteShop()).text();

    // Regular merchandise = quoteShop.subtotal_minor + sale_discount_minor = 2900.
    expect(text).toContain(formatMinorCurrency(2900, 'USD'));
    expect(text).toContain(formatMinorCurrency(400, 'USD'));
    expect(text).toContain(formatMinorCurrency(300, 'USD'));
    // Subtotal = regular - sale - code = 2200.
    expect(text).toContain(formatMinorCurrency(2200, 'USD'));
    expect(text).toContain(formatMinorCurrency(999, 'USD'));
    // Total is the accepted charge the buyer will pay, not a re-derived sum.
    expect(text).toContain(formatMinorCurrency(3199, 'USD'));
    expect(text).toMatch(/Estimated delivery: Sep 26 - 30(?:, \d{4})?/);
  });

  it('shows a pending state while the server computes the charge', () => {
    expect(render(undefined, true).text()).toContain('Calculating...');
  });

  it('defers to checkout instead of inventing a charge before a quote exists', () => {
    const text = render().text();

    expect(text).toContain('Calculated at checkout');
    // The cart is merchandise-only, so the shop's own cart total stands in
    // until the server prices shipping.
    expect(text).toContain(formatMinorCurrency(2500, 'USD'));
  });

  it('formats per-shop money in the checkout currency, never the shipping source currency', () => {
    const text = render(buildQuoteShop({ shippingMinor: 215646 }), false, 'VND').text();

    // Regular merchandise is denominated in the checkout currency.
    expect(text).toContain(formatMinorCurrency(2900, 'VND'));
    expect(text).toContain(formatMinorCurrency(215646, 'VND'));
    expect(text).toContain(formatMinorCurrency(300, 'VND'));
    expect(text).not.toContain(formatMinorCurrency(215646, 'USD'));
  });

  it('renders free-shipping savings and subtracts sale and code savings exactly once', () => {
    const text = render(buildQuoteShop({ shippingMinor: 0, shippingDiscountMinor: 800 })).text();

    expect(text).toContain('Shipping savings');
    expect(text).toContain(formatMinorCurrency(800, 'USD'));
    // Net shipping charge remains visible.
    expect(text).toContain(formatMinorCurrency(0, 'USD'));
    // Regular merchandise = 2500 + 400; subtotal = 2900 - 400 - 300.
    expect(text).toContain(formatMinorCurrency(2900, 'USD'));
    expect(text).toContain(formatMinorCurrency(2200, 'USD'));
    // Total accepted by the server equals the subtotal when shipping is fully waived.
    expect(text).toContain(formatMinorCurrency(2200, 'USD'));
  });
});
