import { test, expect } from '@playwright/test';

test('TC-04 - Create New Project', async ({ page }) => {
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
  await page.getByRole('link', { name: 'List of Project' }).click();
  await page.getByRole('button', { name: ' Create New' }).click();
  await page.getByText('Yes').click();
  await page.getByRole('textbox', { name: 'Enter DTF Project Code' }).click();
  await page.getByRole('textbox', { name: 'Enter DTF Project Code' }).fill('DTF-Auto-008');
  await page.getByRole('textbox', { name: 'Project Code', exact: true }).click();
  await page.getByRole('textbox', { name: 'Project Code', exact: true }).fill('DTF-Auto-008');
  await page.getByRole('textbox', { name: 'Enter Project Title' }).click();
  await page.getByRole('textbox', { name: 'Enter Project Title' }).fill('DTF-Auto-008');
  await page.getByPlaceholder('EnterStartDate').fill('2026-04-01');
  await page.getByPlaceholder('EnterEndDate').fill('2028-04-01');
  await page.locator('svg').first().click();
  await page.locator('#react-select-2-input').fill('sgd');
  await page.getByText('Singapore Dollar (SGD)', { exact: true }).click();
  await page.getByRole('textbox', { name: 'Enter Project Budget' }).click();
  await page.getByRole('textbox', { name: 'Enter Project Budget' }).fill('1000000');
  await page.locator('svg').nth(1).click();
  await page.getByText('Headquarters', { exact: true }).click();
  await page.getByRole('textbox', { name: 'Enter Project Description' }).click();
  await page.getByRole('textbox', { name: 'Enter Project Description' }).fill('DTF-Auto-008');
  await page.getByRole('row', { name: 'Overall Project In-Charge *' }).locator('svg').click();
  await page.locator('#react-select-4-option-0').click();
  await page.locator('div').filter({ hasText: /^Please select user$/ }).nth(3).click();
  await page.locator('#react-select-5-option-0').click();
  await page.getByText('Please select Project Team').click();
  await page.locator('#react-select-6-option-0').click();
  await page.locator('div:nth-child(3) > .css-tj5bde-Svg').click();
  await page.getByText('New User', { exact: true }).click();
  await page.getByRole('button', { name: 'Create' }).click();
  await page.getByRole('button', { name: 'Yes' }).click();
  await page.getByRole('button', { name: 'I Understand' }).click();
});