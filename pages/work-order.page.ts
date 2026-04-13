import { Page } from "@playwright/test";

export class WorkOrderPage {
  constructor(private page: Page) {}

  async navigateToWorkOrders() {
    await this.page.getByText('Orders').click();
    await this.page.locator('a').filter({ hasText: 'Orders' }).click();
    await this.page.getByRole('link', { name: 'WO List' }).click();
    await this.page.waitForLoadState('networkidle');
    // Reload to ensure the list reflects changes made in a separate tab
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
  }

  async convertToWorkOrder(contractTitle: string) {
    // Double-click the first matching row using the first gridcell
    await this.page.getByRole('gridcell', { name: contractTitle }).first().dblclick();

    // Opens in a new tab — wait for it and switch to it
    const newPage = await this.page.context().waitForEvent('page');
    await newPage.waitForLoadState('networkidle');

    // Click Convert to WO button
    await newPage.getByRole('button', { name: 'Convert to WO' }).click();

    // Confirm the pop-up
    await newPage.getByRole('button', { name: 'Yes' }).click();
    await newPage.waitForLoadState('networkidle');
  }

  async issueWorkOrder(contractTitle: string) {
    // Double-click the first matching row using the first gridcell
    await this.page.getByRole('gridcell', { name: contractTitle }).first().dblclick();

    // Opens in a new tab — wait for it and switch to it
    const newPage = await this.page.context().waitForEvent('page');
    await newPage.waitForLoadState('networkidle');

    // Click Issue button
    await newPage.getByRole('button', { name: 'Issue' }).click();

    // Confirm the pop-up
    await newPage.getByRole('button', { name: 'I Understand' }).click();
    await newPage.waitForLoadState('networkidle');
  }
}
