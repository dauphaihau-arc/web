import { formatMinorCurrency } from '@arc/utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { CartShopGroup } from '~/domains/cart/api/cart.shared';
import type { CheckoutQuoteShop } from '~/domains/me/api/order/contracts/order.contract';
import ShopCartSummary from './shop-cart-summary.vue';

const SHOP_ID = '00000000-0000-4000-8000-000000000001';
const PRODUCT_ID = '00000000-0000-4000-8000-000000000002';
const INVENTORY_ID = '00000000-0000-4000-8000-000000000003';
const PROFILE_ID = '00000000-0000-4000-8000-000000000004';
const RATE_ID = '00000000-0000-4000-8000-000000000005';

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

function buildQuoteShop(overrides?: { shippingMinor?: number, chargeTotalMinor?: number, shippingDiscountMinor?: number }): CheckoutQuoteShop {
  const chargeTotalMinor = overrides?.chargeTotalMinor ?? 999;
  const shippingMinor = overrides?.shippingMinor ?? chargeTotalMinor;
  const shippingDiscountMinor = overrides?.shippingDiscountMinor ?? 0;

  return {
    shop_id: SHOP_ID,
    shop_name: 'Ceramics Studio',
    shop_slug: 'ceramics-studio',
    subtotal_minor: 2500,
    sale_discount_minor: 400,
    discount_minor: 0,
    shipping_minor: shippingMinor,
    shipping_discount_minor: shippingDiscountMinor,
    total_minor: 2500 + shippingMinor,
    promo_codes: [],
    origin_countries: ['US'],
    shipping: {
      shop_id: SHOP_ID,
      currency: 'USD',
      charge: {
        currency: 'USD',
        quantity: 2,
        base_unit: { product_id: PRODUCT_ID, inventory_id: INVENTORY_ID, one_item_fee_minor: 799 },
        base_item_fee_minor: 799,
        base_item_total_minor: 799,
        additional_items_quantity: 1,
        additional_components: [
          {
            product_id: PRODUCT_ID, inventory_id: INVENTORY_ID, quantity: 1, additional_item_fee_minor: 200,
          },
        ],
        additional_item_fee_minor_total: 200,
        total_minor: chargeTotalMinor,
      },
      estimate: {
        processing_time_min_days: 1,
        processing_time_max_days: 3,
        delivery_time_min_days: 3,
        delivery_time_max_days: 5,
        combined_min_days: 4,
        combined_max_days: 8,
        anchor_at: '2026-09-22T00:00:00.000Z',
        earliest_delivery_date: '2026-09-26T00:00:00.000Z',
        latest_delivery_date: '2026-09-30T00:00:00.000Z',
      },
      units: [
        {
          product_id: PRODUCT_ID,
          inventory_id: INVENTORY_ID,
          quantity: 2,
          profile_id: PROFILE_ID,
          profile_version: 1,
          profile_shop_id: SHOP_ID,
          rate_id: RATE_ID,
          rate_destination_scope: 'country',
          rate_destination_country: 'US',
          currency: 'USD',
          one_item_fee_minor: 799,
          additional_item_fee_minor: 200,
          processing_time_min_days: 1,
          processing_time_max_days: 3,
          delivery_time_min_days: 3,
          delivery_time_max_days: 5,
        },
      ],
    },
  } as unknown as CheckoutQuoteShop;
}

function render(quoteShop?: CheckoutQuoteShop, isPending = false, checkoutCurrency?: string) {
  return mount(ShopCartSummary, {
    props: {
      shopCart: buildShopCart(), quoteShop, isPending, checkoutCurrency,
    },
  });
}

describe('shop cart summary', () => {
  it('renders the accepted per-shop money, Shipping Charge, and seller estimate', () => {
    const wrapper = render(buildQuoteShop());
    const text = wrapper.text();

    expect(text).toContain('Product(s) total');
    expect(text).toContain('Sale savings');
    expect(text).toContain('Code savings');
    expect(text).toContain('Subtotal');
    expect(text).toContain('Shipping');
    expect(text).toContain('Total');
    // Regular merchandise = quoteShop.subtotal_minor + sale_discount_minor = 2900.
    expect(text).toContain(formatMinorCurrency(2900, 'USD'));
    expect(text).toContain(formatMinorCurrency(400, 'USD'));
    expect(text).toContain(formatMinorCurrency(999, 'USD'));
    // Subtotal = regular - sale - code = 2500.
    expect(text).toContain(formatMinorCurrency(2500, 'USD'));
    // Total is the accepted charge the buyer will pay, not a re-derived sum.
    expect(text).toContain(formatMinorCurrency(3499, 'USD'));
    expect(text).toMatch(/Estimated delivery: Sep 26 - 30(?:, \d{4})?/);
  });

  it('never exposes profile, rate, warehouse, carrier, or fabricated delivery options', () => {
    const text = render(buildQuoteShop()).text();

    expect(text).not.toContain(PROFILE_ID);
    expect(text).not.toContain(RATE_ID);
    expect(text).not.toContain('Standard');
    expect(text).not.toContain('Express');
    expect(text).not.toContain('Warehouse');
    expect(text).not.toContain('Carrier');
    expect(text).not.toContain('FREE');
  });

  it('shows a real zero charge without asserting free shipping on its own', () => {
    const text = render(buildQuoteShop({ shippingMinor: 0, chargeTotalMinor: 0 })).text();

    expect(text).toContain(formatMinorCurrency(2900, 'USD'));
    expect(text).toContain(formatMinorCurrency(2500, 'USD'));
    expect(text).toContain(formatMinorCurrency(0, 'USD'));
    expect(text).not.toContain('FREE');
  });

  it('defers to checkout instead of inventing a charge before a quote exists', () => {
    const text = render().text();

    expect(text).toContain('Calculated at checkout');
    // The cart is merchandise-only, so the shop's own cart total is shown as
    // both the product total and the total until the server prices shipping.
    expect(text).toContain(formatMinorCurrency(2500, 'USD'));
    expect(text).not.toContain('FREE');
  });

  it('shows the cart shop group Code savings before any quote prices the shop', () => {
    const wrapper = mount(ShopCartSummary, {
      props: {
        shopCart: { ...buildShopCart(), discount_minor: 1250 },
      },
    });
    const text = wrapper.text();

    expect(text).toContain('Code savings');
    // The applied code's saving is shown against the shop total, and the
    // subtotal is reduced by it, matching the overall Summary Order.
    expect(text).toContain(formatMinorCurrency(1250, 'USD'));
  });

  it('shows a pending state while the server computes the charge', () => {
    expect(render(undefined, true).text()).toContain('Calculating...');
  });

  it('formats per-shop money in the checkout currency, never the shipping source currency', () => {
    // The accepted snapshot keeps the seller's source rate amounts in the shop
    // currency, while the accepted money is denominated in the checkout currency.
    const wrapper = render(buildQuoteShop({ chargeTotalMinor: 215646 }), false, 'VND');
    const text = wrapper.text();

    expect(text).toContain(formatMinorCurrency(2900, 'VND'));
    expect(text).toContain(formatMinorCurrency(215646, 'VND'));
    expect(text).not.toContain(formatMinorCurrency(215646, 'USD'));
    expect(text).not.toContain(formatMinorCurrency(2900, 'USD'));
  });

  it('renders free-shipping savings and subtracts sale savings exactly once', () => {
    const text = render(buildQuoteShop({ shippingMinor: 0, chargeTotalMinor: 0, shippingDiscountMinor: 700 })).text();

    expect(text).toContain('Shipping savings');
    expect(text).toContain(formatMinorCurrency(700, 'USD'));
    // Net shipping charge remains visible.
    expect(text).toContain(formatMinorCurrency(0, 'USD'));
    // Regular merchandise = 2500 + 400; subtotal = 2900 - 400 - 0.
    expect(text).toContain(formatMinorCurrency(2900, 'USD'));
    expect(text).toContain(formatMinorCurrency(2500, 'USD'));
    // Total accepted by the server equals the subtotal when shipping is fully waived.
    expect(text).toContain(formatMinorCurrency(2500, 'USD'));
  });
});
