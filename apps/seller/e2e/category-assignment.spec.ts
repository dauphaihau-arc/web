import { expect, test } from '@playwright/test';
import {
  CATEGORY_IDENTITY_GENERATION_HEADER,
  loadSellerE2eEnvironment,
  observeCategoryTraffic,
} from './support/seller-api';

/**
 * Runs against the isolated seller runtime pinned to the API's active category
 * identity generation (`3`) — a deployed compatible bundle. It proves the real
 * seller journey still works after the public-identity cutover: pick the seeded
 * parent/child category ("Apparel › Shirts"), pick the "Size" attribute
 * ("Medium"), save a draft, and read the persisted product back through the
 * public API. It also proves the app itself attaches the generation header on
 * the category-bearing requests the browser sends (no Playwright-injected
 * header).
 */
test('assigns a public category and attribute and saves a draft through the real API', async ({ page }) => {
  const { apiBaseUrl, compatibleGeneration, fixtures } = loadSellerE2eEnvironment();
  await page.goto('/login');
  // SSR controls are visible before the client attaches form handlers.
  await page.waitForFunction(
    'document.querySelector("#__nuxt")?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false',
  );
  await page.getByLabel('Email').fill(fixtures.seller.email);
  await page.getByLabel('Password', { exact: true }).fill(fixtures.seller.password);
  const loginButton = page.getByRole('button', { name: 'Log in', exact: true });
  await expect(loginButton).toBeEnabled();
  const [loginResponse] = await Promise.all([
    page.waitForResponse(response =>
      response.request().method() === 'POST'
      && new URL(response.url()).pathname.endsWith('/auth/login'),
    ),
    loginButton.click(),
  ]);
  expect(loginResponse.status()).toBe(200);
  await expect(page).toHaveURL(/\/dashboard(?:[/?#]|$)/);

  const traffic = observeCategoryTraffic(page);

  await page.goto('/products/new', { waitUntil: 'domcontentloaded' });

  await page.getByLabel('Title').fill('E2E Summer Shirt');
  await page.locator('textarea[name="description"]').fill('A lightweight summer shirt.');
  await page.getByLabel('Price').fill('15');

  // Live category selection: suggestions are a category-bearing request.
  const categoryInput = page.getByRole('combobox');
  await categoryInput.click();
  await categoryInput.fill('shirts');
  await page.getByRole('option').filter({ hasText: 'Shirts' }).first().click();

  // Attributes for the selected category: Size = Medium.
  await page.getByLabel('Size').click();
  await page.getByRole('option', { name: 'Medium' }).click();

  const saveDraft = page.getByRole('button', { name: 'Save draft' });
  await expect(saveDraft).toBeEnabled();

  const [draftResponse] = await Promise.all([
    page.waitForResponse(response =>
      response.request().method() === 'POST'
      && new URL(response.url()).pathname.endsWith('/products/drafts'),
    ),
    saveDraft.click(),
  ]);
  expect(draftResponse.ok()).toBe(true);
  const draft = await draftResponse.json() as { id: string };
  expect(draft.id).toBeTruthy();

  // Read the persisted product back through the real public API using the
  // explicitly selected compatible generation. Explicit headers are allowed for
  // setup/readback calls only — never the browser.
  const readback = await page.context().request.get(
    `${apiBaseUrl}/shops/${fixtures.shopPublicId}/products/${draft.id}`,
    { headers: { [CATEGORY_IDENTITY_GENERATION_HEADER]: compatibleGeneration } },
  );
  expect(readback.ok()).toBe(true);
  const product = await readback.json() as {
    category_id?: string
    attributes?: Array<{ category_attribute_name?: string, selected_option_value?: string }>
  };
  expect(product.category_id).toBe(fixtures.childCategoryPublicId);
  expect(product.attributes?.some(attribute =>
    attribute.category_attribute_name === 'Size' && attribute.selected_option_value === 'Medium',
  )).toBe(true);

  // The app — not the test harness — supplied the generation header on the
  // category-bearing requests the browser actually sent.
  const paths = traffic.categoryRequests.map(entry => entry.path);
  expect(paths.some(path => path.startsWith('/categories/suggestions'))).toBe(true);
  expect(paths.some(path => /^\/categories\/[^/]+\/attributes$/.test(path))).toBe(true);
  expect(paths.some(path => path.endsWith('/products/drafts'))).toBe(true);
  expect(traffic.categoryRequests.every(entry => entry.generation === compatibleGeneration)).toBe(true);
});
