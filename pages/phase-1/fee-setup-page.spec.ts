import { Page } from "@playwright/test";

export class FeeSetupPage {
  constructor(private page: Page) {}

  async navigateToFeeSetup(financialInstitution: string) {
    await this.page.getByRole('link', { name: ' Manage Financial' }).click();
    await this.page.getByRole('textbox', { name: 'Search...' }).nth(1).click();
    await this.page.getByRole('textbox', { name: 'Search...' }).nth(1).fill(financialInstitution);
    await this.page.getByRole('gridcell', { name: financialInstitution, exact: true }).dblclick();
    await this.page.getByRole('button', { name: 'Edit ' }).click();
  }

  async addProjectFee(data: any) {
    //Add Project
    await this.page.getByRole('button', { name: ' Add New' }).click();
    await this.page.getByRole('textbox', { name: 'Search...' }).first().click();
    await this.page.getByRole('textbox', { name: 'Search...' }).first().fill(data.main_con.project_code);
    await this.page.waitForTimeout(500);

    //Check the checkbox for the project
    const row = this.page.locator('.ag-row').filter({ hasText: data.main_con.project_code }).first();
    await row.locator('.ag-checkbox-input-wrapper input').check();

    //Entity and Project Tagging
    await this.page.getByLabel('VC Gateway').click();
    await this.page.keyboard.press('ArrowDown');
    await this.page.keyboard.press('Enter');

    await this.page.locator('#clientId').click();
    await this.page.locator('#clientId').fill(data.doxa_admin.client_id);

    await this.page.locator('#buyerId').click();
    await this.page.locator('#buyerId').fill(data.doxa_admin.buyer_id);

    await this.page.locator('#proxyPoolId').click();
    await this.page.locator('#proxyPoolId').fill(data.doxa_admin.proxypool_id);

    await this.page.locator('#cifNumber').click();
    await this.page.locator('#cifNumber').fill(data.doxa_admin.cif_number);

    await this.page.locator('#rsid1').click();
    await this.page.locator('#rsid1').fill(data.doxa_admin.rsid1_dev_main);

    await this.page.locator('#rsid2').click();
    await this.page.locator('#rsid2').fill(data.doxa_admin.rsid2_main_sub);

    //Platform Fee (BPS)
    for (const rowText of ['Trade Line', 'Virtual Card']) {
      const row = this.page.locator('.ag-row').filter({ hasText: rowText });
      for (let i = 1; i <= 7; i++) {
        const cell = row.locator('.ag-cell').nth(i);
        await cell.dblclick();
        await this.page.keyboard.type(data.doxa_admin.platform_fee);
        await this.page.keyboard.press('Tab');
      }
    }

    //DTF Fee - Virtual Card (BPS)
    const vcRow = this.page.locator('.ag-row').filter({ hasText: 'Virtual Card' }).last();

    // Tier 1-3 Type cells (blue) at column indices 2, 4, 6
    for (const colIdx of [2, 4, 6]) {
      const cell = vcRow.locator('.ag-cell').nth(colIdx);
      await cell.dblclick();
      await this.page.keyboard.type(data.doxa_admin.dtf_fee_vc.tier_1_3);
      await this.page.keyboard.press('Tab');
    }

    // Tier 4-6 Type cells (indices 8, 10, 12) — select G from dropdown
    for (const colIdx of [8, 10, 12]) {
      await vcRow.locator('.ag-cell').nth(colIdx).dblclick();
      await this.page.locator('.ag-select-list-item').filter({ hasText: /^G$/ }).click();
    }

    // Tier 7+ — Tab twice from Tier 6 to scroll it into view, then select G
    await this.page.keyboard.press('Tab');
    await this.page.keyboard.press('Tab');
    await this.page.keyboard.press('Enter');
    await this.page.locator('.ag-select-list-item').filter({ hasText: /^G$/ }).click();
  }

  async saveChanges() {
    await this.page.getByRole('button', { name: 'Add' }).click();
    await this.page.waitForTimeout(1000); // Wait for save to complete
    await this.page.getByRole('button', { name: 'Save' }).click();
    await this.page.waitForTimeout(1000);
  }
}