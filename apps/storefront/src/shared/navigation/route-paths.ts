export const routePaths = {
  home: '/',
  category: '/c',
  reset: '/reset',
  account: '/account',
  accountAddresses: '/account/addresses',
  accountMessages: '/account/messages',
  orders: '/orders',
  search: '/search',
  cart: '/cart',
  cartCheckout: '/cart/checkout',
  checkout: '/checkout',
  guestOrders: '/guest-orders',
  success: '/success',
} as const;

export function buildOrderDetailPath(id: string): string {
  return `${routePaths.orders}/${id}`;
}

export function buildProductDetailPath(
  shopSlug: string,
  productSlug: string,
): string {
  return `/${shopSlug}/${productSlug}`;
}

/**
 * Category identity parsed from a canonical flat category URL segment.
 * `publicId` is the permanent numeric public identity kept as a string so
 * arbitrarily large identifiers never pass through a JavaScript number.
 */
export type CategoryPublicIdentity = {
  slug: string
  publicId: string
};

// Canonical slug characters: lowercase letters, caseless letters (e.g. CJK),
// numbers, and combining marks. Uppercase letters and punctuation are rejected
// because the slug policy lowercases and strips them.
const CATEGORY_SLUG_CHARACTER = String.raw`\p{Ll}\p{Lo}\p{N}\p{M}`;
const CATEGORY_SLUG_PATTERN = new RegExp(
  `^[${CATEGORY_SLUG_CHARACTER}]+(?:-[${CATEGORY_SLUG_CHARACTER}]+)*$`,
  'u',
);

// `<slug>-c<publicId>`: lowercase `c` marker, then a positive decimal identity
// with no leading zero. The slug is greedy so a slug that itself ends in `-c`
// still parses correctly.
const FLAT_CATEGORY_SEGMENT_PATTERN = /^(?<slug>.+)-c(?<publicId>[1-9][0-9]*)$/;

/** A route parameter name carrying the canonical flat category segment. */
export const CATEGORY_ROUTE_PARAM = 'category';

/**
 * Build the canonical flat URL for a category. All category navigation links
 * must be generated through this single policy.
 */
export function buildCategoryPath(slug: string, publicId: string): string {
  return `${routePaths.category}/${slug}-c${publicId}`;
}

/**
 * Parse a flat category route segment. Returns `null` for malformed segments so
 * the route boundary can answer with a genuine 404 instead of guessing.
 */
export function parseCategorySegment(
  segment: string | string[] | undefined,
): CategoryPublicIdentity | null {
  const value = Array.isArray(segment) ? segment[0] : segment;

  if (!value) {
    return null;
  }

  const match = FLAT_CATEGORY_SEGMENT_PATTERN.exec(value);
  const slug = match?.groups?.slug;
  const publicId = match?.groups?.publicId;

  if (!slug || !publicId || !CATEGORY_SLUG_PATTERN.test(slug)) {
    return null;
  }

  return { slug, publicId };
}
