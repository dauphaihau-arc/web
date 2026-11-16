import {
  expect, test as base, type Locator, type Page,
} from '@playwright/test';
import { installStorefrontApiMocks, type StorefrontMockOptions } from '../../e2e/support/network';

/**
 * Visual specs use this `test` instead of the raw one: the app origin is always
 * configured, and the harness needs it as a definite string.
 */
export const test = base.extend<{ appBaseURL: string }>({
  appBaseURL: async ({ baseURL }, use) => {
    if (!baseURL) {
      throw new Error('playwright.visual.config.ts must define use.baseURL');
    }

    await use(baseURL);
  },
});

export { expect };

/**
 * 1x1 transparent PNG. Cross-origin images are answered with this instead of
 * being fetched: a product shot on a CDN host is not part of the app's layout
 * contract and would make a baseline depend on someone else's deploy.
 */
const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AAAwAB/AF/8B4AAAAASUVORK5CYII=',
  'base64',
);

/**
 * Opens a storefront route with every network dependency pinned:
 *
 * - API responses come from the shared E2E fixtures, so the rendered copy,
 *   prices, and counts are stable.
 * - Same-origin documents and assets still load from the served app.
 * - Cross-origin images are replaced with a transparent pixel and every other
 *   cross-origin request is aborted, so an unreachable font or CDN turns into a
 *   deterministic fallback rather than a timeout that depends on the runner.
 * - The color mode is pinned to light before the first paint.
 */
export async function openVisualPage(
  page: Page,
  baseURL: string,
  path: string,
  options: StorefrontMockOptions = {},
) {
  await page.addInitScript(() => {
    localStorage.setItem('nuxt-color-mode', 'light');
  });

  await installStorefrontApiMocks(page, options);

  // Registered after the API mocks: Playwright matches routes newest-first, so
  // this handler runs first and defers same-origin traffic back to the mocks.
  const appOrigin = new URL(baseURL).origin;

  // Only static assets are neutralised. fetch/xhr must still reach the API mocks
  // below, which match on path alone — the built app calls an absolute API host,
  // so aborting every cross-origin request here would kill `/health/ready` and
  // leave the app behind its backend-wake-up overlay.
  const blockedResourceTypes: Record<string, true> = {
    font: true,
    stylesheet: true,
    script: true,
    media: true,
    other: true,
  };

  await page.route('**/*', (route) => {
    const request = route.request();

    if (new URL(request.url()).origin === appOrigin) {
      return route.fallback();
    }

    if (request.resourceType() === 'image') {
      return route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: TRANSPARENT_PNG,
      });
    }

    if (blockedResourceTypes[request.resourceType()]) {
      return route.abort();
    }

    return route.fallback();
  });

  await page.goto(path);
}

/**
 * Blocks the screenshot until the page has stopped moving.
 *
 * `marker` is the first piece of real content the route renders; waiting on it
 * avoids capturing a skeleton. The scroll pass then forces reveal-on-scroll
 * sections and lazy hydration to run, which a full-page capture would otherwise
 * photograph as empty space, before returning to the document origin.
 *
 * Never replace this with `waitForTimeout`: the suite runs on a shared runner
 * and a fixed sleep is both slower and still wrong.
 */
export async function waitForVisualReady(page: Page, marker: Locator) {
  await expect(marker).toBeVisible();
  await page.waitForLoadState('networkidle');

  await page.evaluate(async () => {
    const nextPaint = () => {
      const { promise, resolve } = Promise.withResolvers<undefined>();
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(undefined)));
      return promise;
    };

    await document.fonts.ready;

    const step = Math.max(window.innerHeight - 100, 200);

    for (let offset = 0; offset < document.body.scrollHeight; offset += step) {
      window.scrollTo(0, offset);
      await nextPaint();
    }

    window.scrollTo(0, 0);
    await nextPaint();
  });

  await page.waitForLoadState('networkidle');
}

/**
 * Images are always masked. They are already transparent pixels, and masking
 * them keeps a layout shift inside an image slot out of the diff while the
 * surrounding card, price, and title still have to match.
 */
export function maskImages(page: Page) {
  return [page.locator('img')];
}
