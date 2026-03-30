import { Page } from '@playwright/test';

export class ForecastPage {
  constructor(private page: Page) {}

  async navigateToForecast() {
    await this.page.getByRole('link', { name: 'Manage Project Forecast' }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async openProjectForecast(projectCode: string) {
    // Step 1: Click the project row to navigate to the project detail page
    // The Forecast button is NOT on the list page — must open the detail page first
    await this.page.getByRole('row').filter({ hasText: projectCode }).click();
    await this.page.waitForLoadState('networkidle');

    // Step 2: Scroll to and click the Forecast button on the detail page
    const forecastButton = this.page.getByRole('button', { name: 'Forecast' });
    await forecastButton.scrollIntoViewIfNeeded();
    await forecastButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async addTradeWithBudget(budget: string) {
    // Click Add Trade
    await this.page.getByRole('button', { name: 'Add trade' }).click();

    // Select the first trade checkbox
    await this.page.getByRole('checkbox').first().check();

    // Click Add to confirm selection
    await this.page.getByRole('button', { name: 'Add' }).click();
    await this.page.waitForLoadState('networkidle');

    // Fill the Initial Budget cell for the newly added trade row
    // Scroll right and down as needed to locate the cell
    const initialBudgetCell = this.page.getByRole('row').last().getByRole('cell').filter({ hasText: '' }).last();
    await initialBudgetCell.scrollIntoViewIfNeeded();
    await initialBudgetCell.click();
    await initialBudgetCell.fill(budget);
  }

  async save() {
    await this.page.getByRole('button', { name: 'Save' }).click();
    await this.page.waitForLoadState('networkidle');
  }
}
