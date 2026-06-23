import { expect, test } from '@playwright/test'
import { installStorefrontApiMocks } from '../support/network'

test('looks up guest orders from the public tracking form', async ({ page }) => {
  await installStorefrontApiMocks(page, {
    currentUser: null,
    guestOrdersResponse: {
      order_shops: [],
    },
  })

  await page.goto('/guest-orders')

  await page.getByLabel('Email').fill('guest@example.com')
  await page.getByLabel('Order number').fill('ORDER-1001')
  await page.getByLabel('ZIP / Postal code').fill('94107')
  await page.getByRole('button', { name: 'Find order' }).click()

  await expect(page).toHaveURL(/guest-orders\?/)
  await expect(page.getByText('No guest orders matched that lookup.')).toBeVisible()
})
