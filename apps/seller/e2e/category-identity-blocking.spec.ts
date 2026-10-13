import { expect, test, type Page } from '@playwright/test';
import {
  loadSellerE2eFixtures,
  loginSeller,
  observeCategoryTraffic,
} from './support/seller-api';

/**
 * Runs against a simulated stale-generation seller runtime (`1`) with the real
 * public-ID API (`2`). Every test proves the guard's observable behaviour: the
 * scoped card replaces the category surface, the app never sends the generation
 * it does not own, exactly one automatic reload happens per browser session,
 * and no category-bearing request — including any create/update submission —
 * leaves the browser.
 */

const CARD = 'category-identity-update-card';
const CHECK_UPDATE = 'category-identity-check-update';

/** Read session storage, tolerating a navigation that destroys the page context. */
function readSession(page: Page, key: string) {
  return page.evaluate(name => sessionStorage.getItem(name), key).catch(() => null);
}

/** Count full document loads per browser session so a reload is provable. */
function installLoadCounter(page: Page) {
  return page.addInitScript(() => {
    // Ignore same-origin iframes (e.g. Nuxt DevTools); count only the document.
    if (window.top !== window.self) {
      return;
    }

    const loads = Number(sessionStorage.getItem('e2e-load-count') ?? '0');
    sessionStorage.setItem('e2e-load-count', String(loads + 1));
  });
}

test('blocks the product list with a single reload and a scoped card', async ({ page }) => {
  const fixtures = loadSellerE2eFixtures();
  await loginSeller(page.context().request, fixtures);
  await installLoadCounter(page);

  const traffic = observeCategoryTraffic(page);

  // The real API speaks public-ID semantics; this runtime advertises the stale
  // generation, so the guard blocks and reloads once. Start on mobile.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/products', { waitUntil: 'domcontentloaded' });

  await expect(page.getByTestId(CARD).first()).toBeVisible({ timeout: 45_000 });
  await expect(page.getByTestId(CHECK_UPDATE).first()).toBeVisible();
  await expect.poll(() => readSession(page, 'e2e-load-count')).toBe('2');

  // The guard rejected the requests before any network call left the browser.
  expect(traffic.categoryRequests).toEqual([]);

  // Stable and exact: one probe before the reload, one on the reloaded page.
  await expect.poll(() => traffic.contractProbes.length).toBe(2);

  // Desktop surface in the same blocked session.
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.getByTestId(CARD).first()).toBeVisible();

  // Focus / reconnect — even after a long idle — must not re-probe or reload.
  await page.evaluate(() => {
    window.dispatchEvent(new Event('focus'));
    window.dispatchEvent(new Event('online'));
  });
  await page.waitForTimeout(8_000);
  expect(traffic.contractProbes.length).toBe(2);
  expect(traffic.categoryRequests).toEqual([]);
  expect(await readSession(page, 'e2e-load-count')).toBe('2');
  await expect(page.getByTestId(CARD).first()).toBeVisible();

  // Actual SPA navigation (no full reload) to an unrelated route: no card and
  // no extra document load; the block is scoped to category surfaces.
  await page.getByRole('link', { name: 'Dashboard' }).first().click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByTestId(CARD)).toHaveCount(0);
  expect(await readSession(page, 'e2e-load-count')).toBe('2');

  // Back through the SPA: the latch is still respected without a reload.
  await page.getByRole('link', { name: 'Products' }).first().click();
  await expect(page).toHaveURL(/\/products$/);
  await expect(page.getByTestId(CARD).first()).toBeVisible();
  expect(await readSession(page, 'e2e-load-count')).toBe('2');
});

test('blocks live category selection and attributes on create without submitting', async ({ page }) => {
  const fixtures = loadSellerE2eFixtures();
  await loginSeller(page.context().request, fixtures);
  await installLoadCounter(page);

  const traffic = observeCategoryTraffic(page);

  await page.goto('/products/new', { waitUntil: 'domcontentloaded' });

  // The form is genuinely live before the guard latches.
  await expect(page.getByLabel('Title')).toBeVisible({ timeout: 45_000 });
  await page.getByLabel('Title').fill('Blocked create');
  await page.locator('textarea[name="description"]').fill('Should never be submitted.');
  await page.getByLabel('Price').fill('15');

  // Interacting with the live category selector probes the contract, latches
  // the mismatch, and reloads once. No suggestion request reaches the network.
  const categoryInput = page.getByRole('combobox');
  await categoryInput.click();
  await categoryInput.fill('shirts');
  await expect.poll(() => readSession(page, 'e2e-load-count')).toBe('2');

  // On the reloaded page the mismatch latches in memory: the card replaces the
  // form and no second reload happens.
  await expect(page.getByRole('combobox')).toBeVisible({ timeout: 45_000 });
  await page.getByRole('combobox').click();
  await page.getByRole('combobox').fill('shirts');
  await expect(page.getByTestId(CARD).first()).toBeVisible({ timeout: 45_000 });
  await expect.poll(() => readSession(page, 'e2e-load-count')).toBe('2');

  // The attribute fetch never runs and no create request is submitted.
  expect(traffic.categoryRequests).toEqual([]);
  expect(traffic.submissions).toEqual([]);
  await expect.poll(() => traffic.contractProbes.length).toBe(2);

  // Mobile surface in the same blocked session.
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId(CARD).first()).toBeVisible();
});

test('blocks editing an existing product without submitting an update', async ({ page }) => {
  const fixtures = loadSellerE2eFixtures();
  await loginSeller(page.context().request, fixtures);
  await installLoadCounter(page);

  const traffic = observeCategoryTraffic(page);

  // A real, stable fixture product that predates the blocked session.
  await page.goto(`/products/${fixtures.fixtureProductPublicId}`, { waitUntil: 'domcontentloaded' });

  await expect(page.getByTestId(CARD).first()).toBeVisible({ timeout: 45_000 });
  await expect(page.getByTestId(CHECK_UPDATE).first()).toBeVisible();
  await expect.poll(() => readSession(page, 'e2e-load-count')).toBe('2');

  // The product detail request is category-bearing; it never left the browser,
  // and no update section was submitted.
  expect(traffic.categoryRequests).toEqual([]);
  expect(traffic.submissions).toEqual([]);
  await expect.poll(() => traffic.contractProbes.length).toBe(2);

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.getByTestId(CARD).first()).toBeVisible();

  await page.evaluate(() => {
    window.dispatchEvent(new Event('focus'));
    window.dispatchEvent(new Event('online'));
  });
  await page.waitForTimeout(8_000);
  expect(traffic.contractProbes.length).toBe(2);
  expect(traffic.submissions).toEqual([]);
  expect(await readSession(page, 'e2e-load-count')).toBe('2');
  await expect(page.getByTestId(CARD).first()).toBeVisible();
});
