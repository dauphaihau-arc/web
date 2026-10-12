import type { APIRequestContext, Page } from '@playwright/test';
import type { SellerE2eFixtures } from './environment';

export {
  loadSellerE2eEnvironment,
  loadSellerE2eFixtures,
} from './environment';
export type { SellerE2eEnvironment, SellerE2eFixtures } from './environment';

/** Header the app must attach to category-bearing requests. */
export const CATEGORY_IDENTITY_GENERATION_HEADER = 'x-category-identity-generation';

/**
 * Log the seeded seller in through the frontend proxy so the browser shares the
 * session cookie. The request context's base URL is the project's frontend
 * origin, so the proxy path matches the app's own `/api/v1` transport.
 */
export async function loginSeller(request: APIRequestContext, fixtures: SellerE2eFixtures): Promise<void> {
  const response = await request.post('/api/v1/auth/login', {
    data: { email: fixtures.seller.email, password: fixtures.seller.password, app: 'seller' },
  });

  if (response.status() !== 200) {
    throw new Error(`seller login failed: ${response.status()} ${await response.text()}`);
  }
}

/**
 * True when a request path carries or resolves category identity — the same
 * rule the app guard and the backend interceptor enforce. Duplicated locally so
 * the browser-observing tests do not depend on build-time path aliases.
 */
export function isCategoryBearingApiPath(path: string): boolean {
  if (path === '/categories/contract') {
    return false;
  }

  if (path === '/categories' || path.startsWith('/categories/')) {
    return true;
  }

  if (path === '/products' || path === '/products/facets') {
    return true;
  }

  return /^\/shops\/[^/]+\/products(\/|$)/.test(path);
}

export type ObservedCategoryRequest = {
  path: string
  method: string
  generation: string | undefined
};

/**
 * Observe the browser's own requests (not the request-context setup/readback
 * calls): the contract probe count, every category-bearing request with the
 * generation header the app actually attached, and any create/update submission.
 */
export function observeCategoryTraffic(page: Page) {
  const contractProbes: string[] = [];
  const categoryRequests: ObservedCategoryRequest[] = [];
  const submissions: string[] = [];

  page.on('request', (request) => {
    const url = new URL(request.url());

    // Only the app's API transport carries category identity; the page's own
    // document/navigation requests (e.g. the `/products` document) do not.
    if (!url.pathname.startsWith('/api/v1/')) {
      return;
    }

    const path = url.pathname.slice('/api/v1'.length);

    if (path === '/categories/contract') {
      contractProbes.push(url.search);
      return;
    }

    if (!isCategoryBearingApiPath(path)) {
      return;
    }

    categoryRequests.push({
      path,
      method: request.method(),
      generation: request.headers()[CATEGORY_IDENTITY_GENERATION_HEADER],
    });

    if (request.method() !== 'GET') {
      submissions.push(`${request.method()} ${path}`);
    }
  });

  return { contractProbes, categoryRequests, submissions };
}
