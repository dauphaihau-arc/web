import type { Page, Route } from '@playwright/test';
import { createUser, type E2ENotification, type E2EUser } from './factories';

type CheckoutOrderResponse = {
  checkout_pending?: boolean
  checkout_session_url?: string
  order_shops: Array<{
    id: string
    order_number: string
    shop: {
      id: string
      shop_name: string
      slug: string
    }
  }>
};

type E2EAddress = {
  id: string
  user: string
  full_name: string
  address_1: string
  address_2?: string
  city: string
  country: string
  state: string
  zip: string
  phone: string
  is_primary?: boolean
  updated_at: string
  created_at: string
};

type StorefrontMockOptions = {
  currentUser?: E2EUser | null
  loginUser?: E2EUser
  cartQuantity?: number
  cartQuantityAfterLogin?: number
  notifications?: E2ENotification[]
  guestOrdersResponse?: Record<string, unknown>
  productDetailByCurrency?: Record<string, Record<string, unknown>>
  userAddresses?: E2EAddress[]
  checkoutQuoteResponse?: Record<string, unknown>
  checkoutOrderResponse?: CheckoutOrderResponse
  checkoutReadinessResponses?: CheckoutOrderResponse[]
};

const defaultAuthClientConfig = {
  version: 'e2e-config-v1',
  password: {
    min_length: 8,
    max_length: 64,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).+$',
    requirements: {
      lowercase: true,
      uppercase: true,
      number: true,
      special_character: true,
    },
    message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
  },
  session: {
    access_token_ttl_seconds: 900,
    refresh_token_ttl_seconds: 604800,
  },
  ai: {
    product_description_enabled: false,
  },
};

function fulfillJSON(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function buildCart(quantity: number) {
  const itemQuantity = Math.max(quantity, 1);

  return {
    cart: {
      id: 'cart-e2e-1',
      user_id: 'user-e2e-1',
      is_temp: true,
      total_quantity: itemQuantity,
      recent_items: [],
      shop_groups: [
        {
          shop: {
            id: 'shop-e2e-1',
            name: 'E2E Shop',
          },
          items: [
            {
              id: 'cart-item-e2e-1',
              quantity: itemQuantity,
              is_selected: true,
              unit_price_minor: 1200,
              product: {
                id: 'product-e2e-1',
                title: 'E2E Product',
                slug: 'e2e-product',
                shop: {
                  slug: 'e2e-shop',
                },
                variant_type: 'single',
                image_url: 'https://example.test/product.png',
              },
              inventory: {
                id: 'inventory-e2e-1',
                amount_minor: 1200,
                original_amount_minor: 1500,
                currency: 'USD',
                stock: 5,
                variant_name: 'Blue',
              },
            },
          ],
          currency: 'USD',
          total_minor: 1200 * itemQuantity,
          shipping_minor: 0,
        },
      ],
    },
    summary: {
      currency: 'USD',
      subtotal_minor: 1200 * itemQuantity,
      discount_minor: 0,
      subtotal_after_discount_minor: 1200 * itemQuantity,
      shipping_minor: 0,
      total_minor: 1200 * itemQuantity,
      total_selected_quantity: itemQuantity,
      total_quantity: itemQuantity,
      total_items: itemQuantity,
      subtotal: 12 * itemQuantity,
      total_discount: 0,
      total_shipping_fee: 0,
      total_tax: 0,
      total_price: 12 * itemQuantity,
    },
  };
}

function buildMarketConfig() {
  return {
    markets: [
      {
        code: 'US',
        name: 'United States',
        defaultCurrency: 'USD',
        supportedCurrencies: ['USD', 'EUR'],
        defaultLocale: 'en-US',
        supportedLocales: ['en-US'],
        enabled: true,
      },
    ],
  };
}

function buildIpData() {
  return {
    country_name: 'United States',
    currency: {
      code: 'USD',
    },
  };
}

function buildCategories() {
  return [
    {
      id: 'category-jewelry',
      parent_id: null,
      name: 'Jewelry',
      rank: 1,
      image_storage_key: null,
      image_url: null,
      featured_facet_keys: [],
      attributes: [],
    },
    {
      id: 'category-art',
      parent_id: null,
      name: 'Art',
      rank: 2,
      image_storage_key: null,
      image_url: null,
      featured_facet_keys: [],
      attributes: [],
    },
  ];
}

function buildDefaultProductDetail(currency: string) {
  const pricingByCurrency = {
    EUR: {
      amount_minor: 1100,
      original_amount_minor: 1500,
      currency: 'EUR',
    },
    USD: {
      amount_minor: 1234,
      original_amount_minor: 1500,
      currency: 'USD',
    },
  } as const;

  const pricing = pricingByCurrency[currency as keyof typeof pricingByCurrency] ?? pricingByCurrency.USD;

  return {
    id: 'product-e2e-1',
    category_id: 'category-jewelry',
    title: 'Handmade Ring',
    slug: 'handmade-ring',
    variant_type: 'none',
    variant_group_name: '',
    variant_sub_group_name: '',
    stock_notice_threshold: 2,
    shop: {
      id: 'shop-e2e-1',
      slug: 'artisan-shop',
      shop_name: 'Artisan Shop',
      owner_user_id: 'owner-1',
    },
    images: [],
    variants: [],
    review_summary: {
      average: 0,
      count: 0,
    },
    shipping: {
      destinations: [],
    },
    inventory: [
      {
        id: `inventory-${pricing.currency.toLowerCase()}`,
        amount_minor: pricing.amount_minor,
        original_amount_minor: pricing.original_amount_minor,
        currency: pricing.currency,
        stock: 10,
        variant_label: null,
        sub_variant_label: null,
      },
    ],
  };
}

export async function installStorefrontApiMocks(
  page: Page,
  options: StorefrontMockOptions = {},
) {
  let currentUser = options.currentUser ?? null;
  let cartQuantity = options.cartQuantity ?? 0;
  const loginUser = options.loginUser ?? createUser();
  let notifications = [...(options.notifications ?? [])];
  const guestOrdersResponse = options.guestOrdersResponse ?? {
    order_shops: [],
  };
  const productDetailByCurrency = options.productDetailByCurrency ?? {};
  const userAddresses = options.userAddresses ?? [
    {
      id: 'address-e2e-1',
      user: currentUser?.id ?? 'user-e2e-1',
      full_name: 'E2E Buyer',
      address_1: '123 Test St',
      city: 'Los Angeles',
      country: 'United States',
      state: 'California',
      zip: '90001',
      phone: '1234567890',
      is_primary: true,
      updated_at: '2026-09-04T00:00:00.000Z',
      created_at: '2026-09-04T00:00:00.000Z',
    },
  ];
  const checkoutQuoteResponse = options.checkoutQuoteResponse ?? {
    quote_id: 'quote-e2e-1',
    presentment_currency: 'USD',
    checkout_currency: 'USD',
    subtotal_minor: 1200,
    shipping_minor: 0,
    discount_minor: 0,
    total_minor: 1200,
    expires_at: '2026-09-04T01:00:00.000Z',
    items: [],
  };
  const checkoutOrderResponse = options.checkoutOrderResponse ?? {
    checkout_session_url: 'https://checkout.stripe.com/e2e-session',
    checkout_pending: false,
    order_shops: [
      {
        id: 'order-e2e-1',
        order_number: 'ORD-E2E-1',
        shop: {
          id: 'shop-e2e-1',
          shop_name: 'E2E Shop',
          slug: 'e2e-shop',
        },
      },
    ],
  };
  const checkoutReadinessResponses = [...(options.checkoutReadinessResponses ?? [])];

  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname } = url;
    const method = request.method();

    if (pathname === '/api/ip-data' && method === 'GET') {
      return fulfillJSON(route, buildIpData());
    }

    if (pathname.endsWith('/marketplace/config') && method === 'GET') {
      return fulfillJSON(route, buildMarketConfig());
    }

    if (pathname.endsWith('/auth/client-config') && method === 'GET') {
      return fulfillJSON(route, defaultAuthClientConfig);
    }

    if (pathname.endsWith('/categories') && method === 'GET') {
      return fulfillJSON(route, buildCategories());
    }

    if (pathname.endsWith('/health/ready') && method === 'GET') {
      return fulfillJSON(route, { status: 'ok' });
    }

    if (pathname.endsWith('/auth/me') && method === 'GET') {
      if (!currentUser) {
        return fulfillJSON(route, { message: 'Unauthorized' }, 401);
      }

      return fulfillJSON(route, currentUser);
    }

    if (pathname.endsWith('/auth/login') && method === 'POST') {
      currentUser = loginUser;
      cartQuantity = options.cartQuantityAfterLogin ?? cartQuantity;
      return fulfillJSON(route, { user: loginUser });
    }

    if (pathname.endsWith('/me/addresses') && method === 'GET') {
      return fulfillJSON(route, {
        results: userAddresses,
        page: 1,
        limit: userAddresses.length,
        total_pages: 1,
        total_results: userAddresses.length,
      });
    }

    if (pathname.endsWith('/cart/merge') && method === 'POST') {
      return fulfillJSON(route, buildCart(cartQuantity));
    }

    if (pathname.endsWith('/cart') && method === 'GET') {
      return fulfillJSON(route, buildCart(cartQuantity));
    }

    if (
      (
        pathname.endsWith('/me/checkout/buy-now/quote')
        || pathname.endsWith('/me/checkout/quote')
      )
      && method === 'POST'
    ) {
      return fulfillJSON(route, checkoutQuoteResponse);
    }

    if (
      (
        pathname.endsWith('/me/checkout/buy-now')
        || pathname.endsWith('/me/checkout')
      )
      && (method === 'PUT' || method === 'POST')
    ) {
      return fulfillJSON(route, checkoutOrderResponse);
    }

    if (pathname.endsWith('/me/checkout/session/readiness') && method === 'GET') {
      return fulfillJSON(
        route,
        checkoutReadinessResponses.shift() ?? checkoutReadinessResponses.at(-1) ?? checkoutOrderResponse,
      );
    }

    if (pathname.endsWith('/me/notifications/unread-count') && method === 'GET') {
      return fulfillJSON(route, {
        unread_count: notifications.filter(notification => !notification.read_at).length,
      });
    }

    if (pathname.endsWith('/me/notifications') && method === 'GET') {
      return fulfillJSON(route, {
        results: notifications,
        total_results: notifications.length,
      });
    }

    if (pathname.endsWith('/me/notifications/read-all') && method === 'PATCH') {
      notifications = notifications.map(notification => ({
        ...notification,
        read_at: notification.read_at ?? new Date().toISOString(),
      }));

      return fulfillJSON(route, {
        success: true,
      });
    }

    if (pathname.includes('/me/notifications/') && pathname.endsWith('/read') && method === 'PATCH') {
      const notificationId = pathname.split('/').at(-2);
      notifications = notifications.map((notification) => {
        if (notification.id !== notificationId || notification.read_at) {
          return notification;
        }

        return {
          ...notification,
          read_at: new Date().toISOString(),
        };
      });

      return fulfillJSON(route, {
        success: true,
      });
    }

    if (pathname.endsWith('/checkout/guest-orders') && method === 'GET') {
      return fulfillJSON(route, guestOrdersResponse);
    }

    if (pathname.includes('/products/by-slug/') && pathname.endsWith('/views') && method === 'POST') {
      return fulfillJSON(route, { success: true });
    }

    if (pathname.includes('/products/by-slug/') && pathname.endsWith('/recommendation-sections') && method === 'GET') {
      return fulfillJSON(route, { sections: [] });
    }

    if (pathname.includes('/products/by-slug/') && pathname.endsWith('/review-images') && method === 'GET') {
      return fulfillJSON(route, {
        items: [],
        meta: {
          next_cursor: undefined,
          has_more: false,
        },
      });
    }

    if (pathname.includes('/products/by-slug/') && pathname.endsWith('/reviews') && method === 'GET') {
      return fulfillJSON(route, {
        items: [],
        summary: {
          average: 0,
          count: 0,
          breakdown: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
          },
          filters: {
            has_images: 0,
            has_comment: 0,
          },
        },
        meta: {
          total: 0,
          page: 1,
          limit: 4,
        },
      });
    }

    if (pathname.includes('/products/by-slug/') && method === 'GET') {
      const requestedCurrency = request.headers()['x-currency'] ?? 'USD';
      const detailResponse = productDetailByCurrency[requestedCurrency] ?? buildDefaultProductDetail(requestedCurrency);

      return fulfillJSON(route, detailResponse);
    }

    return route.continue();
  });
}
