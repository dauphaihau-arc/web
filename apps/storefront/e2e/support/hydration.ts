import type { Page } from '@playwright/test';

/**
 * Wait until the Nuxt client has finished hydrating the server-rendered page.
 *
 * In SSR mode Playwright can click a hydrated-looking element before Vue has
 * attached its listeners (hydration walks the tree top-down, so footer controls
 * are attached last). Clicking earlier is a silent no-op: the visible DOM is
 * already there, but the handler is not. Waiting for `isHydrating` to clear
 * makes interactions deterministic without changing any assertion.
 */
export async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const nuxt = (window as Window & {
      useNuxtApp?: () => { isHydrating?: boolean }
    }).useNuxtApp;

    if (typeof nuxt !== 'function') {
      // No Nuxt client app on the page (e.g. a non-page document response).
      return true;
    }

    try {
      return nuxt().isHydrating !== true;
    }
    catch {
      return true;
    }
  }, undefined, { timeout: 20_000 });
}
