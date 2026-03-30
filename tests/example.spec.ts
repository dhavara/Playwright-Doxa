import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});

test('Login', async ({page}) => {
  await page.goto('https://auth-uat.doxa-holdings.com/login');

  await page.locator('#email').fill('dhava.maincon@getnada.com');
  await page.locator('#password').fill('123456789');

  await page.getByRole('button', { name: 'Login' }).click();

  // await expect(page).toHaveURL('https://admin-uat.doxa-holdings.com/', {timeout: 10000});

  // await expect(page).toHaveTitle('/Dashboard/', {timeout: 10000});
});
