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

test('TC-01 - Login Successful', async ({page}) => {
  test.setTimeout(60000);
  await page.goto('https://auth-uat.doxa-holdings.com/login');

  await page.locator('#email').fill('dhava.maincon@getnada.com');
  await page.locator('#password').fill('123456789');

  await page.getByRole('button', { name: 'Login' }).click();

  // await expect(page).toHaveURL('https://connex-uat.doxa-holdings.com/dashboard');

  // await expect(page).toHaveTitle('/Dashboard/');
});

test('TC-02 - Login Failed - Invalid Email', async ({page}) => {
  test.setTimeout(60000);
  await page.goto('https://auth-uat.doxa-holdings.com/login');

  await page.locator('#email').fill('invalidemail@getnada.com');
  await page.locator('#password').fill('123456789');

  await page.getByRole('button', { name: 'Login' }).click();

  const errorMessage = page.locator('#default > div:nth-child(3) > span');
  await expect(errorMessage).toBeVisible();
});

test('TC-03 - Login Failed - Invalid Password', async ({page}) => {
  test.setTimeout(60000);
  await page.goto('https://auth-uat.doxa-holdings.com/login');

  await page.locator('#email').fill('dhava.maincon@getnada.com');
  await page.locator('#password').fill('invalidpass');

  await page.getByRole('button', { name: 'Login' }).click();

  const errorMessage = page.locator('#default > div:nth-child(3) > span');
  await expect(errorMessage).toBeVisible();
});
