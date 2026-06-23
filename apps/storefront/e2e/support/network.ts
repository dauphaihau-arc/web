import type { Page, Route } from '@playwright/test';
import { createUser, type E2ENotification, type E2EUser } from './factories';

type StorefrontMockOptions = {
  currentUser?: E2EUser | null
  loginUser?: E2EUser
  cartQuantity?: number
  cartQuantityAfterLogin?: number
  notifications?: E2ENotification[]
  guestOrdersResponse?: Record<string, unknown>
  productDetailByCurrency?: Record<string, Record<string, unknown>>
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
  return {
    cart: {
      id: 'cart-e2e-1',
      total_quantity: quantity,
      recent_items: [],
      shops: [],
      summary: {
        total_items: quantity,
        subtotal: 0,
        total_discount: 0,
        total_shipping_fee: 0,
        total_tax: 0,
        total_price: 0,
      },
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
  options: StorefrontMockOptions = {}
) {
  let currentUser = options.currentUser ?? null;
  let cartQuantity = options.cartQuantity ?? 0;
  const loginUser = options.loginUser ?? createUser();
  let notifications = [...(options.notifications ?? [])];
  const guestOrdersResponse = options.guestOrdersResponse ?? {
    order_shops: [],
  };
  const productDetailByCurrency = options.productDetailByCurrency ?? {};

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

    if (pathname.endsWith('/cart/merge') && method === 'POST') {
      return fulfillJSON(route, buildCart(cartQuantity));
    }

    if (pathname.endsWith('/cart') && method === 'GET') {
      return fulfillJSON(route, buildCart(cartQuantity));
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
