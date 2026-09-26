import { describe, expect, it } from 'vitest';
import { buildBuyNowQuoteBody, buildCartQuoteBody } from './checkout-quote-body';
import type { CheckoutAddress } from '~/domains/cart/stores/cart.store.types';

const memberAddress = {
  id: 'address-1',
  full_name: 'Ada Lovelace',
  address_1: '1 Analytical Way',
  city: 'London',
  country: 'GB',
  state: 'ENG',
  zip: 'N1',
  phone: '0700',
} as unknown as CheckoutAddress;

const guestAddress = {
  full_name: 'Ada Lovelace',
  address_1: '1 Analytical Way',
  city: 'London',
  country: 'GB',
  state: 'ENG',
  zip: 'N1',
  phone: '0700',
} as unknown as CheckoutAddress;

describe('buildCartQuoteBody', () => {
  it('prices a member cart from the saved address and keeps only adjusted shops', () => {
    const body = buildCartQuoteBody({
      isAuthenticated: true,
      address: memberAddress,
      guestCurrency: 'USD',
      additionInfoShopCarts: new Map([
        ['shop-adjusted', { promoCodes: ['FREESHIP'], note: 'Leave at door' }],
        ['shop-untouched', { promoCodes: [], note: '' }],
      ]),
    });

    expect(body).toEqual({
      user_address_id: 'address-1',
      addition_info_shop_carts: [
        { shop_id: 'shop-adjusted', promo_codes: ['FREESHIP'], note: 'Leave at door' },
      ],
    });
  });

  it('prices a guest cart from the entered address and presentment currency', () => {
    const body = buildCartQuoteBody({
      isAuthenticated: false,
      address: guestAddress,
      guestCurrency: 'EUR',
      additionInfoShopCarts: new Map(),
    });

    expect(body).toEqual({
      shipping_address: {
        full_name: 'Ada Lovelace',
        address_1: '1 Analytical Way',
        address_2: undefined,
        city: 'London',
        country: 'GB',
        state: 'ENG',
        zip: 'N1',
        phone: '0700',
      },
      presentment_currency: 'EUR',
    });
  });
});

describe('buildBuyNowQuoteBody', () => {
  it('carries the temp cart, promo codes, and note the buyer entered', () => {
    const body = buildBuyNowQuoteBody({
      isAuthenticated: true,
      address: memberAddress,
      guestCurrency: 'USD',
      tempCartId: 'temp-cart-1',
      promoCodes: ['SAVE10'],
      note: 'Gift wrap',
    });

    expect(body).toEqual({
      cart_id: 'temp-cart-1',
      user_address_id: 'address-1',
      promo_codes: ['SAVE10'],
      note: 'Gift wrap',
    });
  });

  it('omits empty promo codes and note instead of sending blank inputs', () => {
    const body = buildBuyNowQuoteBody({
      isAuthenticated: true,
      address: memberAddress,
      guestCurrency: 'USD',
      tempCartId: 'temp-cart-1',
      promoCodes: [],
      note: '',
    });

    expect(body).toEqual({
      cart_id: 'temp-cart-1',
      user_address_id: 'address-1',
    });
  });
});
