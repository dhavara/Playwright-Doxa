import {Page} from '@playwright/test';

export class VACheckerPage {
  constructor(public page: Page) {}

  async navigateToDTFTree() {
    await this.page.locator('a').filter({ hasText: 'Manage DTF' }).click();
    await this.page.getByRole('link', {name: 'DTF Tree'}).click();
    await this.page.waitForLoadState('networkidle');
  }

  async selectProjectOwner(data: { project_owner_label: string; wr_number: string; wr_label: string }) {
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');

    this.page.on('response', async (response) => {
      const url = response.url();
      if (response.status() === 200 && !url.match(/\.(js|css|png|jpg|svg|ico|woff2?)(\?|$)/)) {
        try {
          const body = await response.json();
          console.log(`\n[API] ${response.request().method()} ${url}`);
          console.log(JSON.stringify(body, null, 2));
        } catch {
          // not JSON, skip
        }
      }
    });

    await this.page.getByText('Please select Project Owner').click();
    await this.page.getByText(data.project_owner_label, { exact: true }).click();
    await this.page.getByText('Please select a Work Request').click();
    await this.page.locator('#react-select-3-input').fill(data.wr_number);
    await this.page.getByText(data.wr_label, { exact: true }).click();
  }

  async selectVATree(data: { claim_month: string }): Promise<{ url: string; body: object }> {
    await this.page.getByText('Please select Tree').click();
    await this.page.getByText('VA Tree', { exact: true }).click();

    const claimMonthInput = this.page.getByRole('textbox', { name: 'Claim Month *' });
    await claimMonthInput.click();
    await claimMonthInput.fill(data.claim_month);

    const treeApiPromise = this.page.waitForResponse(
      res => res.url().includes('dtfOverview') && res.url().includes(data.claim_month) && res.status() === 200
    );
    await claimMonthInput.press('Enter');
    await this.page.waitForLoadState('networkidle');

    const response = await treeApiPromise;
    return { url: response.url(), body: await response.json() };
  }
}