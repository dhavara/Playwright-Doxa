import { test, expect } from '@playwright/test';

test('TC-05 - Forecast a Project', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('https://admin-uat.doxa-holdings.com/login');
  await page.getByRole('textbox', { name: 'Email *' }).click();
  await page.getByRole('textbox', { name: 'Email *' }).fill('dhava.maincon@getnada.com');
  await page.getByRole('textbox', { name: 'Password *' }).click();
  await page.getByRole('textbox', { name: 'Password *' }).fill('123456789');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.waitForURL('https://admin-uat.doxa-holdings.com/**', { timeout: 15_000 });
  await page.waitForLoadState('networkidle');

  await page.getByText('System Configuration').click();
  
  await page.locator('a').filter({ hasText: 'Project Management' }).click();
  await page.getByRole('link', { name: 'Manage Project Forecast' }).click();
  await page.getByRole('gridcell', { name: 'DTF-Auto-' }).nth(1).dblclick();
  await page.getByRole('button', { name: 'Forecast' }).click();
  await page.getByRole('button', { name: ' Add Trade' }).click();
  await page.getByRole('checkbox', { name: 'Press Space to toggle row' }).check();
  await page.getByRole('button', { name: 'Add' }).click();
  await page.getByRole('gridcell', { name: '0.00' }).nth(4).click();
  await page.getByRole('textbox', { name: 'Input Editor' }).fill('1000000');
  await page.getByRole('textbox', { name: 'Input Editor' }).press('Enter');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('button', { name: 'I Understand' }).click();
});