import { expect, test, type Page } from '@playwright/test';
import { installStorefrontApiMocks } from '../support/network';
import { waitForHydration } from '../support/hydration';

/**
 * Static-suite coverage for the preferences language field.
 *
 * The field lives below Region and switches to the other configured locale on
 * save, keeps the current page and query, and never changes the currency.
 * Persistence and the root redirect run in the SSR suite, where the server can
 * read the stored preference instead of a build-time static payload.
 */

/**
 * Home rails are not part of the language contract. Serving them as empty keeps
 * the page short and prevents an unmocked request from tripping the backend
 * wake-up overlay and hiding the footer.
 */
function mockEmptyProductRails(page: Page) {
  return page.route(/\/products\/(trending|best-sellers|recently-viewed)/, route =>
    route.fulfill({ json: { items: [] } }));
}

async function chooseVietnamese(page: Page) {
  await page.getByTestId('market-preferences-trigger').click();

  const languageField = page.getByLabel('Language');

  await expect(languageField).toBeVisible();
  await expect(languageField).toBeEnabled();
  await languageField.click();
  await page.getByRole('option', { name: 'Tiếng Việt', exact: true }).click();
  await expect(languageField).toContainText('Tiếng Việt');
  await page.getByTestId('market-preferences-save').click();
}

test('choosing Vietnamese preserves the page and query, keeps USD, and translates the footer', async ({ page }) => {
  await installStorefrontApiMocks(page, { currentUser: null });
  await mockEmptyProductRails(page);

  await page.goto('/?ref=test');
  await waitForHydration(page);

  const footer = page.locator('footer');
  const preferencesTrigger = page.getByTestId('market-preferences-trigger');

  await expect(footer.getByText('Shop', { exact: true }).filter({ visible: true })).toHaveText('Shop');
  await expect(preferencesTrigger).toContainText('USD');

  await chooseVietnamese(page);

  // Same page and query, now under the Vietnamese prefix.
  await expect(page).toHaveURL(/\/vi\?ref=test$/, { timeout: 10_000 });

  // Currency is carried over untouched by the language change.
  await expect(preferencesTrigger).toContainText('USD');

  // Vietnamese catalogue copy from `src/i18n/locales/vi/footer.json` replaces
  // the English strings after the client-side locale switch.
  await expect(footer.getByText('Mua sắm', { exact: true }).filter({ visible: true })).toHaveText('Mua sắm');
  await expect(footer.getByText('Trạng thái đơn hàng', { exact: true }).filter({ visible: true })).toHaveText('Trạng thái đơn hàng');
});

/**
 * Proves the language switch carries over to localised catalog content, not
 * just chrome. The category surface only renders server-side, so this runs in
 * SSR mode against the seeded category fixture (`/c/gaming-laptops-c1`).
 */
test('choosing Vietnamese on a category page keeps the category and translates catalog copy', async ({ page }) => {
  test.skip(process.env.E2E_MODE !== 'ssr', 'Needs the SSR category fixture');

  await page.goto('/c/gaming-laptops-c1');
  await waitForHydration(page);

  await expect(page).toHaveURL(/\/c\/gaming-laptops-c1$/);
  await expect(
    page.getByText('Sort by:', { exact: true }).filter({ visible: true }).first(),
  ).toBeVisible({ timeout: 20_000 });

  await chooseVietnamese(page);

  // The category path is language-neutral, so only the locale prefix is added.
  await expect(page).toHaveURL(/\/vi\/c\/gaming-laptops-c1$/, { timeout: 10_000 });
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  await expect(page.getByText(/Sắp xếp theo:/).first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('button', { name: 'Đặt lại bộ lọc' }).first()).toBeVisible();
});
