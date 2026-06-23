import { expect, test } from '@playwright/test';
import { createNotification, createUser } from '../support/factories';
import { installStorefrontApiMocks } from '../support/network';

test('marks all notifications as read from the account notifications page', async ({ page }) => {
  await installStorefrontApiMocks(page, {
    currentUser: createUser(),
    notifications: [
      createNotification({
        id: 'notification-unread',
        title: 'Unread notification',
        body: 'This notification should become read.',
        read_at: null,
      }),
      createNotification({
        id: 'notification-read',
        title: 'Read notification',
        body: 'This notification is already read.',
        read_at: '2026-06-22T11:00:00.000Z',
      }),
    ],
  });

  await page.goto('/account/notifications');

  await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
  await expect(page.getByText('1 unread · 2 total')).toBeVisible();

  await page.getByRole('button', { name: 'Mark all read' }).click();

  await expect(page.getByText('0 unread · 2 total')).toBeVisible();
});
