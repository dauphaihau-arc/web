import { expect, test } from '@playwright/test';
import { createUser } from '../support/factories';
import { installStorefrontApiMocks } from '../support/network';

/**
 * Static-suite coverage for the language field on the buyer account page.
 * The field lives below Region and changes the same Buyer Language Preference as
 * the footer dialog, including the locale-aware navigation afterwards.
 */
test('the buyer account page exposes the language setting below Region', async ({ page }) => {
  await installStorefrontApiMocks(page, {
    currentUser: createUser(),
  });

  await page.goto('/account');

  const preferences = page.locator('form').filter({ has: page.getByText('Market preferences') }).first();

  await expect(preferences.getByText('Region', { exact: true })).toBeVisible();
  await expect(preferences.getByText('Language', { exact: true })).toBeVisible();
  await expect(preferences.getByText('Currency', { exact: true })).toBeVisible();

  // Language sits between Region and Currency.
  const region = await preferences.getByText('Region', { exact: true }).boundingBox();
  const language = await preferences.getByText('Language', { exact: true }).boundingBox();
  const currency = await preferences.getByText('Currency', { exact: true }).boundingBox();

  expect(region).not.toBeNull();
  expect(language).not.toBeNull();
  expect(currency).not.toBeNull();
  expect(language!.y).toBeGreaterThan(region!.y);
  expect(language!.y).toBeLessThan(currency!.y);

  const languageField = preferences.getByLabel('Language');
  await languageField.click();
  await page.getByRole('option', { name: 'Tiếng Việt', exact: true }).click();
  await expect(languageField).toContainText('Tiếng Việt');

  await preferences.getByRole('button', { name: 'Save preferences' }).click();

  await expect(page).toHaveURL(/\/vi\/account$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
});
