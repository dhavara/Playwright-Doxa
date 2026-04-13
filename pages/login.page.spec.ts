import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    // baseURL is https://admin-uat.doxa-holdings.com
    await this.page.goto('https://admin-uat.doxa-holdings.com/login');
  }

  async login(email: string, password: string) {
    // Use role-based selectors matching actual site labels
    const emailInput = this.page.getByRole('textbox', { name: 'Email *' });
    const passwordInput = this.page.getByRole('textbox', { name: 'Password *' });

    await emailInput.clear();
    await emailInput.fill(email);
    await passwordInput.clear();
    await passwordInput.fill(password);

    await this.page.getByRole('button', { name: 'Login' }).click();
  }

  async waitForDashboard() {
    await this.page.waitForURL('https://admin-uat.doxa-holdings.com/**', { timeout: 20_000 });
    await this.page.waitForLoadState('networkidle');
  }
}

export class LoginPage2 {
  constructor(private page: Page) {}

  async goto() {
    // baseURL is https://subcon-uat.doxa-holdings.com
    await this.page.goto('https://subcon-uat.doxa-holdings.com/dashboard');
  }

  async login(email: string, password: string) {
    // Use role-based selectors matching actual site labels
    const emailInput = this.page.getByRole('textbox', { name: 'Email *' });
    const passwordInput = this.page.getByRole('textbox', { name: 'Password *' });

    await emailInput.clear();
    await emailInput.fill(email);
    await passwordInput.clear();
    await passwordInput.fill(password);

    await this.page.getByRole('button', { name: 'Login' }).click();
  }

async waitForDashboard() {
  // Wait for SSO to land on any doxa domain
  await this.page.waitForURL('https://subcon-uat.doxa-holdings.com/dashboard', { timeout: 20_000 });
    await this.page.waitForLoadState('networkidle');
}
}
