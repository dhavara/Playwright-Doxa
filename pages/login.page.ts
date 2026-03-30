import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    // Clear fields first to prevent session bleed/prefill from previous runs
    const emailInput = this.page.locator('#email');
    const passwordInput = this.page.locator('#password');

    await emailInput.clear();
    await emailInput.fill(email);

    await passwordInput.clear();
    await passwordInput.fill(password);

    await this.page.getByRole('button', { name: 'Login' }).click();
  }

  async waitForDashboard() {
    await this.page.waitForURL(/admin-uat\.doxa-holdings\.com/, { timeout: 30000 });
  }
}
