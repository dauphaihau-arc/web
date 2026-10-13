/**
 * Deterministic backend fixtures for the SSR browser regression suite.
 *
 * One fixture graph backs every request the real storefront server (SSR) and
 * the browser make: category resolution, category lists, product listings,
 * facets, and the boot rails. The same module is imported by the fixture HTTP
 * server and by the specs, so the assertions and the served data cannot drift.
 *
 * Flat canonical URL contract: `/c/:slug-c:publicId` (lowercase `c`, positive
 * decimal digits, no leading zeros).
 */

export const PUBLIC_IDENTITY_CONTRACT_VERSION = '2';

export const CATEGORY_IDENTITY_GENERATION_HEADER = 'x-category-identity-generation';

/** Categories keyed by their public identity (decimal string). */
export const CATEGORY_BY_ID = {
  // Root with products — the home-navigation target.
  1: {
    id: '1',
    slug: 'gaming-laptops',
    name: 'Gaming Laptops',
    parent_id: null,
    rank: 1,
    image_url: null,
    featured_facet_keys: ['brand'],
    attributes: [],
  },
  // Child of 1 — proves ancestry is served, not reconstructed from navigation.
  3: {
    id: '3',
    slug: 'gaming-mice',
    name: 'Gaming Mice',
    parent_id: '1',
    rank: 1,
    image_url: null,
    featured_facet_keys: ['connection'],
    attributes: [],
  },
  // Visible root with no eligible products — the empty-state case.
  9: {
    id: '9',
    slug: 'empty-shelf',
    name: 'Empty Shelf',
    parent_id: null,
    rank: 2,
    image_url: null,
    featured_facet_keys: [],
    attributes: [],
  },
  // Root with more products than the listing page size, so the paginator
  // renders (total 20 > limit 16). Deliberately kept out of ROOT_CATEGORY_IDS
  // so it never appears in navigation lists and stays isolated to direct access.
  20: {
    id: '20',
    slug: 'pagination-lab',
    name: 'Pagination Lab',
    parent_id: null,
    rank: 3,
    image_url: null,
    featured_facet_keys: [],
    attributes: [],
  },
  // Root whose backend facets are filter-aware (see
  // FACET_DEFINITIONS_BY_CATEGORY), so a browser transition can observe both
  // the listing and the facet alternatives narrowing.
  30: {
    id: '30',
    slug: 'filter-lab',
    name: 'Filter Lab',
    parent_id: null,
    rank: 4,
    image_url: null,
    featured_facet_keys: ['color', 'material'],
    attributes: [],
  },
};

/** Root categories returned by `GET /categories` (list responses expose slug). */
export const ROOT_CATEGORY_IDS = ['1', '9'];

/** Ancestry per category, ordered root-to-leaf and including the category itself. */
export const ANCESTRY_BY_ID = {
  1: ['1'],
  3: ['1', '3'],
  9: ['9'],
  20: ['20'],
  30: ['30'],
};

export const CANONICAL_PATH_BY_ID = {
  1: '/c/gaming-laptops-c1',
  3: '/c/gaming-mice-c3',
  9: '/c/empty-shelf-c9',
  20: '/c/pagination-lab-c20',
  30: '/c/filter-lab-c30',
};

/** Public identity whose resolution fails with a backend error (not a 404). */
export const FAILING_CATEGORY_ID = '500';

/**
 * Deterministic pagination dataset: 20 uniquely identifiable products so page 1
 * (items 01–16) and page 2 (items 17–20) have disjoint, independently expected
 * identities. Order is the array order; the listing slices it by page/limit.
 */
const PAGINATION_LAB_PRODUCTS = Array.from({ length: 20 }, (_, index) => {
  const number = String(index + 1).padStart(2, '0');
  return {
    id: `product-lab-${number}`,
    shop: { id: 'shop-e2e-1', shop_name: 'Arc Supplies', slug: 'arc-supplies' },
    category_id: '20',
    title: `Pagination Lab Item ${number}`,
    slug: `pagination-lab-item-${number}`,
    availability: { in_stock: true, low_stock: false, stock_total: 5 },
    variant_count: 1,
    created_at: `2026-02-${number}T00:00:00.000Z`,
  };
});

export const PRODUCTS = {
  1: [
    {
      id: 'product-laptop-aurora',
      shop: { id: 'shop-e2e-1', shop_name: 'Arc Supplies', slug: 'arc-supplies' },
      category_id: '1',
      title: 'Aurora Gaming Laptop',
      slug: 'aurora-gaming-laptop',
      availability: { in_stock: true, low_stock: false, stock_total: 7 },
      variant_count: 1,
      created_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'product-laptop-nimbus',
      shop: { id: 'shop-e2e-1', shop_name: 'Arc Supplies', slug: 'arc-supplies' },
      category_id: '1',
      title: 'Nimbus Gaming Laptop',
      slug: 'nimbus-gaming-laptop',
      availability: { in_stock: true, low_stock: true, stock_total: 2 },
      variant_count: 1,
      created_at: '2026-01-02T00:00:00.000Z',
    },
  ],
  3: [
    {
      id: 'product-mouse-precision',
      shop: { id: 'shop-e2e-1', shop_name: 'Arc Supplies', slug: 'arc-supplies' },
      category_id: '3',
      title: 'Precision Gaming Mouse',
      slug: 'precision-gaming-mouse',
      availability: { in_stock: true, low_stock: false, stock_total: 12 },
      variant_count: 1,
      created_at: '2026-01-03T00:00:00.000Z',
    },
  ],
  9: [],
  20: PAGINATION_LAB_PRODUCTS,
  30: [
    {
      id: 'product-filter-lab-black-cotton',
      shop: { id: 'shop-e2e-1', shop_name: 'Arc Supplies', slug: 'arc-supplies' },
      category_id: '30',
      title: 'Filter Lab Black Cotton',
      slug: 'filter-lab-black-cotton',
      availability: { in_stock: true, low_stock: false, stock_total: 4 },
      variant_count: 1,
      created_at: '2026-03-01T00:00:00.000Z',
    },
    {
      id: 'product-filter-lab-white-linen',
      shop: { id: 'shop-e2e-1', shop_name: 'Arc Supplies', slug: 'arc-supplies' },
      category_id: '30',
      title: 'Filter Lab White Linen',
      slug: 'filter-lab-white-linen',
      availability: { in_stock: true, low_stock: false, stock_total: 4 },
      variant_count: 1,
      created_at: '2026-03-02T00:00:00.000Z',
    },
  ],
};

/** Category attributes carried by the filter-aware fixture products. */
export const PRODUCT_ATTRIBUTES_BY_ID = {
  'product-filter-lab-black-cotton': [
    { key: 'color', value: 'Black' },
    { key: 'material', value: 'Cotton' },
  ],
  'product-filter-lab-white-linen': [
    { key: 'color', value: 'White' },
    { key: 'material', value: 'Linen' },
  ],
};

export const FACETS_BY_ID = {
  1: [
    {
      facet_key: 'brand',
      attribute_name: 'Brand',
      options: [
        { option_key: 'aurora', value: 'Aurora' },
        { option_key: 'nimbus', value: 'Nimbus' },
      ],
    },
  ],
  3: [
    {
      facet_key: 'connection',
      attribute_name: 'Connection',
      options: [{ option_key: 'wireless', value: 'Wireless' }],
    },
  ],
  9: [],
  20: [],
};

/**
 * Facets whose options are computed from the eligible products of the current
 * query, mirroring the backend contract: a facet's own filter is excluded while
 * every other active filter is honored. This lets a browser regression observe
 * facet alternatives narrowing, not just a static payload.
 */
export const FILTER_AWARE_FACETS_BY_ID = {
  30: [
    {
      facet_key: 'color',
      attribute_name: 'Color',
      options: [
        { option_key: 'black', value: 'Black' },
        { option_key: 'white', value: 'White' },
      ],
    },
    {
      facet_key: 'material',
      attribute_name: 'Material',
      options: [
        { option_key: 'cotton', value: 'Cotton' },
        { option_key: 'linen', value: 'Linen' },
      ],
    },
  ],
};

function toOptionKey(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function activeAttributeFilters(searchParams) {
  const filters = {};

  for (const [key, value] of searchParams.entries()) {
    if (!key.startsWith('attr_')) {
      continue;
    }

    filters[key.slice('attr_'.length)] = new Set(
      value.split(',').map(entry => entry.trim()).filter(Boolean),
    );
  }

  return filters;
}

function attributeFor(product, facetKey) {
  return (PRODUCT_ATTRIBUTES_BY_ID[product.id] ?? []).find(entry => entry.key === facetKey);
}

function productMatchesFilters(product, filters, excludedFacetKey) {
  return Object.entries(filters).every(([facetKey, optionKeys]) => {
    if (facetKey === excludedFacetKey) {
      return true;
    }

    const attribute = attributeFor(product, facetKey);
    return attribute ? optionKeys.has(toOptionKey(attribute.value)) : false;
  });
}

function filterAwareFacets(categoryId, searchParams) {
  const definitions = FILTER_AWARE_FACETS_BY_ID[categoryId] ?? [];
  const filters = activeAttributeFilters(searchParams);
  const products = PRODUCTS[categoryId] ?? [];

  return definitions.map(facet => ({
    facet_key: facet.facet_key,
    attribute_name: facet.attribute_name,
    options: facet.options.filter(option => products.some((product) => {
      const attribute = attributeFor(product, facet.facet_key);
      return productMatchesFilters(product, filters, facet.facet_key)
        && attribute
        && toOptionKey(attribute.value) === option.option_key;
    })),
  }));
}

function productListItems(categoryId, searchParams) {
  const filters = activeAttributeFilters(searchParams);

  return (PRODUCTS[categoryId] ?? []).filter(product => productMatchesFilters(product, filters));
}

export function ancestryFor(id) {
  return (ANCESTRY_BY_ID[id] ?? []).map((ancestorId) => {
    const category = CATEGORY_BY_ID[ancestorId];
    return { id: category.id, slug: category.slug, name: category.name };
  });
}

export function resolutionFor(id) {
  const category = CATEGORY_BY_ID[id];
  if (!category) {
    return null;
  }

  return {
    category: {
      id: category.id,
      slug: category.slug,
      name: category.name,
      ...(category.featured_facet_keys.length > 0
        ? { featured_facet_keys: category.featured_facet_keys }
        : {}),
    },
    ancestry: ancestryFor(id),
    canonical_path: CANONICAL_PATH_BY_ID[id],
  };
}

export function listCategories(parentId) {
  const ids = parentId === undefined
    ? ROOT_CATEGORY_IDS
    : Object.keys(CATEGORY_BY_ID).filter(id => CATEGORY_BY_ID[id].parent_id === parentId);
  return ids.map(id => CATEGORY_BY_ID[id]);
}

const MARKET_CONFIG = {
  markets: [
    {
      code: 'US',
      name: 'United States',
      defaultCurrency: 'USD',
      supportedCurrencies: ['USD'],
      defaultLocale: 'en-US',
      supportedLocales: ['en-US'],
      enabled: true,
    },
  ],
};

const AUTH_CLIENT_CONFIG = {
  version: '1',
  password: {
    min_length: 8,
    max_length: 128,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$',
    requirements: {
      lowercase: true, uppercase: true, number: true, special_character: false,
    },
    message: 'Invalid password',
  },
  session: { access_token_ttl_seconds: 900, refresh_token_ttl_seconds: 604800 },
  ai: { product_description_enabled: false },
};

/** Guest cart with no items, used by the header cart surface on every page. */
const EMPTY_CART = {
  cart: {
    id: 'cart-e2e-empty',
    user_id: 'guest-e2e',
    is_temp: true,
    shop_groups: [],
    recent_items: [],
    total_quantity: 0,
  },
  summary: {
    currency: 'USD',
    subtotal_minor: 0,
    discount_minor: 0,
    subtotal_after_discount_minor: 0,
    shipping_minor: 0,
    total_minor: 0,
    total_selected_quantity: 0,
    total_quantity: 0,
  },
};

function productListResponse(items, requestUrl) {
  const page = Number(requestUrl.searchParams.get('page') ?? '1') || 1;
  const limit = Number(requestUrl.searchParams.get('limit') ?? '16') || 16;
  const total = items.length;
  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    meta: {
      page,
      limit,
      total,
      total_pages: totalPages,
      has_next_page: page < totalPages,
      has_previous_page: page > 1 && page <= totalPages,
    },
  };
}

/**
 * Resolve one backend request against the fixture graph.
 *
 * Returns `{ status, body }` for a handled request, `null` when the request is
 * not part of the fixture contract (the caller records it as unexpected), and
 * for the deliberately failing category a `{ status: 500, body }` so callers
 * can prove backend failures stay errors rather than fabricated 404s.
 */
export function resolveFixtureRequest(method, requestUrl) {
  const { pathname, searchParams } = requestUrl;

  if (pathname === '/health/ready') {
    return { status: 200, body: { status: 'ok' } };
  }

  if (!pathname.startsWith('/v1/')) {
    return null;
  }

  const path = pathname.slice('/v1'.length);

  if (method === 'GET' && path === '/categories/contract') {
    return { status: 200, body: { version: PUBLIC_IDENTITY_CONTRACT_VERSION } };
  }

  if (method === 'GET' && path === '/categories/suggestions') {
    return { status: 200, body: { categories: [] } };
  }

  if (method === 'GET' && path === '/categories') {
    const parentId = searchParams.get('parent_id') ?? undefined;
    return { status: 200, body: listCategories(parentId) };
  }

  const resolutionMatch = /^\/categories\/([^/]+)$/.exec(path);
  if (method === 'GET' && resolutionMatch) {
    const id = decodeURIComponent(resolutionMatch[1]);

    if (id === FAILING_CATEGORY_ID) {
      return { status: 500, body: { message: 'category backend unavailable' } };
    }

    const resolution = resolutionFor(id);
    if (!resolution) {
      return { status: 404, body: { message: 'category not found' } };
    }

    return { status: 200, body: resolution };
  }

  if (method === 'GET' && path === '/products/facets') {
    const categoryId = searchParams.get('category_id') ?? '';
    if (categoryId === '') {
      return { status: 200, body: { facets: [] } };
    }
    if (categoryId in FILTER_AWARE_FACETS_BY_ID) {
      return { status: 200, body: { facets: filterAwareFacets(categoryId, searchParams) } };
    }
    if (!(categoryId in FACETS_BY_ID)) {
      return { status: 404, body: { message: 'category not found' } };
    }
    return { status: 200, body: { facets: FACETS_BY_ID[categoryId] } };
  }

  if (method === 'GET' && (path === '/products' || path === '/products/')) {
    const categoryId = searchParams.get('category_id') ?? '';
    // Unscoped product rails (e.g. home new arrivals) are not category-bearing.
    if (categoryId === '') {
      return { status: 200, body: productListResponse([], requestUrl) };
    }
    if (!(categoryId in PRODUCTS)) {
      return { status: 404, body: { message: 'category not found' } };
    }
    return { status: 200, body: productListResponse(productListItems(categoryId, searchParams), requestUrl) };
  }

  // Home rails: deterministic and empty so unrelated sections never trip the
  // backend wake-up overlay while the category assertions run.
  if (method === 'GET' && /^\/products\/(trending|best-sellers|recently-viewed)$/.test(path)) {
    return { status: 200, body: { items: [] } };
  }

  if (method === 'GET' && path === '/marketplace/config') {
    return { status: 200, body: MARKET_CONFIG };
  }

  if (method === 'GET' && path === '/auth/client-config') {
    return { status: 200, body: AUTH_CLIENT_CONFIG };
  }

  if (method === 'GET' && path === '/auth/me') {
    // Guest visitor.
    return { status: 401, body: { message: 'unauthenticated' } };
  }

  if (method === 'GET' && path === '/cart') {
    return { status: 200, body: EMPTY_CART };
  }

  return null;
}
