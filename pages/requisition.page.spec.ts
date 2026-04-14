import { Page } from "@playwright/test";
import path from 'path';

export interface RequisitionData {
is_project_owner: boolean;
overall_pic:     string;
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
    await this.page.getByText('Requisitions').click();
    await this.page.locator('a').filter({ hasText: 'Requisitions' }).click();
    await this.page.getByRole('link', { name: 'Raise Requisition' }).click();
    await this.page.waitForLoadState('networkidle');
}


async requisitionInfo(data: RequisitionData) {
    // Project — react-select searchable dropdown
    await this.page.locator('svg').first().click();
    await this.page.waitForTimeout(400);
    await this.page.locator('#react-select-2-input').fill(data.project_code.toLowerCase());
    await this.page.waitForTimeout(600);
    await this.page.locator('#react-select-2-input').focus(); // ensure input has focus
    await this.page.locator('#react-select-2-input').press('ArrowDown'); // press on the element, not keyboard
    await this.page.locator('#react-select-2-input').press('Enter');

    // Trade
    await this.page.getByRole('button', { name: 'Please Select Project Trade' }).click();
    await this.page.waitForTimeout(600);
    await this.page.getByText(data.trade_label).click();

    // Contract Title
    await this.page.getByRole('textbox', { name: 'Enter Contract Title' }).fill(data.contract_title);

    // Contract Type
    await this.page.locator('select[name="contractType"]').selectOption(data.contract_type);

    // Person-in-Charge
    await this.page.locator('div').filter({ hasText: /^Please select Person-in-Charge \(Respondent\)$/ }).nth(3).click();
    await this.page.waitForTimeout(400);
    await this.page.locator('[id^="react-select-3-input"]').fill(data.overall_pic);
    await this.page.waitForTimeout(400);
    await this.page.locator('[id^="react-select-3-input"]').press('ArrowDown');
    await this.page.locator('[id^="react-select-3-input"]').press('Enter');

    // Retention rates
    await this.page.getByRole('textbox', { name: '10%' }).fill(data.retention_main);
    await this.page.getByPlaceholder('5%').fill(data.retention_sub);

    // Vendor — react-select searchable dropdown
    await this.page.locator('svg').nth(2).click();
    await this.page.waitForTimeout(400);
    await this.page.getByText(data.vendor, { exact: true }).click();

    // If not project owner, select the first Parent Work Order from the dropdown
    if (!data.is_project_owner) {
        await this.page.locator('svg').nth(3).click();
        await this.page.waitForTimeout(400);
        await this.page.locator('[id^="react-select"][id$="option-0"]').filter({ hasText: /.+/ }).first().click();
    }
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