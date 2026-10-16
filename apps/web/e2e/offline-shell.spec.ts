import { expect, test } from '@playwright/test';

// EFT-140: the app must open and navigate without network once it has been loaded.
test('opens any trainer page offline after the first visit', async ({ page, context }) => {
  await page.goto('/today');
  await expect(page.getByRole('heading', { name: 'Сегодня' })).toBeVisible();

  // Wait until the service worker has installed and controls the page.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve));
    }
  });

  await context.setOffline(true);

  // A full navigation (not client-side routing) to a page never visited before.
  await page.goto('/clients');
  await expect(page.getByRole('heading', { name: 'Клиенты' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Нет сети — данные сохраняются на устройстве');

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Клиенты' })).toBeVisible();
});

test('does not serve API calls from the service worker cache', async ({ page, context }) => {
  await page.goto('/today');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);

  const status = await page.evaluate(() =>
    fetch('/api/health').then(
      (r) => r.status,
      () => 'network-error',
    ),
  );
  expect(status).toBe('network-error');
});
