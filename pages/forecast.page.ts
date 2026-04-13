import { Page } from '@playwright/test';

export class ForecastPage {
  constructor(private page: Page) {}

  async navigateToForecast() {
    await this.page.getByText('System Configuration').click();
    await this.page.locator('a').filter({ hasText: 'Project Management' }).click();
    await this.page.getByRole('link', { name: 'Manage Project Forecast' }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async openProjectForecast(projectCode: string) {
    // Double-click the project row to open it
    await this.page.getByRole('gridcell', { name: projectCode }).dblclick();
    await this.page.waitForLoadState('networkidle');

    // Click the Forecast button on the detail page
    const forecastButton = this.page.getByRole('button', { name: 'Forecast' });
    await forecastButton.scrollIntoViewIfNeeded();
    await forecastButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async addTradeWithBudget(budget: string) {
    // Add Trade
    await this.page.getByRole('button', { name: ' Add Trade' }).click();

    // Select the first trade checkbox
    await this.page.getByRole('checkbox', { name: 'Press Space to toggle row' }).check();

    // Confirm selection
    await this.page.getByRole('button', { name: 'Add' }).click();
    await this.page.waitForLoadState('networkidle');

    // Click the budget cell (5th 0.00 cell) and fill it
    await this.page.getByRole('gridcell', { name: '0.00' }).nth(4).click();
    await this.page.getByRole('textbox', { name: 'Input Editor' }).fill(budget);
    await this.page.getByRole('textbox', { name: 'Input Editor' }).press('Enter');
  }

  async save() {
    await this.page.getByRole('button', { name: 'Save' }).click();
    await this.page.getByRole('button', { name: 'I Understand' }).click();
    await this.page.waitForLoadState('networkidle');
  }
}
