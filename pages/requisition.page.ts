import { Page } from "@playwright/test";
import path from 'path';

export interface RequisitionData {
  project_code:     string;
  project_label:    string;
  project_title:    string;
  csv_filename:     string;
  trade:            string;
  trade_label:      string;
  work_code:        string;
  description:      string;
  unit:             string;
  quantity:         string;
  amount:           string;
  contract_title:   string;
  contract_type:    string;
  retention_main:   string;
  retention_sub:    string;
  vendor:           string;
}

export class RequisitionPage {
  constructor(private page: Page) {}

  async navigateToRaiseRequisition() {
    await this.page.goto('https://subcon-uat.doxa-holdings.com/work-requisition/raise');
    await this.page.waitForLoadState('networkidle');
  }

  async requisitionInfo(data: RequisitionData) {
    // Project — react-select searchable dropdown
    await this.page.locator('svg').first().click();
    await this.page.locator('#react-select-2-input').fill(data.project_code.toLowerCase());

    // Wait for dropdown options to appear — retry up to 3 times, 1s apart
    const optionLocator = this.page.locator('[id^="react-select-2-option"]');
    let found = false;
    for (let i = 0; i < 3; i++) {
      await this.page.waitForTimeout(1000);
      const count = await optionLocator.count();
      if (count > 0) { found = true; break; }
    }
    if (!found) throw new Error(`Project not found for code: ${data.project_code}`);

    await this.page.locator('[id^="react-select-2-option"]').filter({ hasText: data.project_code }).first().click();

    // Trade
    await this.page.getByRole('button', { name: 'Please Select Project Trade' }).click();
    await this.page.getByText(data.trade_label).click();

    // Contract Title
    await this.page.getByRole('textbox', { name: 'Enter Contract Title' }).fill(data.contract_title);

    // Contract Type
    await this.page.locator('select[name="contractType"]').selectOption(data.contract_type);

    // Person-in-Charge — open dropdown and wait for options before clicking
    await this.page.locator('div').filter({ hasText: /^Please select Person-in-Charge \(Respondent\)$/ }).nth(3).click();
    await this.page.waitForSelector('[id^="react-select-3-option"]', { timeout: 3000 });
    await this.page.locator('[id^="react-select-3-option"]').first().click();

    // Retention rates
    await this.page.getByRole('textbox', { name: '10%' }).fill(data.retention_main);
    await this.page.getByPlaceholder('5%').fill(data.retention_sub);

    // Vendor — react-select searchable dropdown
    await this.page.locator('svg').nth(2).click();
    await this.page.waitForTimeout(400);
    await this.page.getByText(data.vendor, { exact: true }).click();
  }

  async uploadCSV(data: RequisitionData) {
    const filePath = path.join(__dirname, '../data', data.csv_filename);
    await this.page.setInputFiles('input[type="file"]', filePath);
  }

  async submitAndConfirm() {
    await this.page.getByRole('button', { name: 'Submit for Approval' }).click();
    await this.page.getByRole('button', { name: 'Yes' }).click();
    await this.page.getByRole('button', { name: 'I Understand' }).click();
    await this.page.waitForLoadState('networkidle');
  }
}
