import { Page } from "@playwright/test";

export class CreateSelfBillingPage {
  constructor(public page: Page) {}

  async createSelfBilling(invoiceSelfBilling: string, vendor: string, projectTitle: string) {
    // Select Self-Billing Invoice type
    await this.page.getByRole("combobox").selectOption("SELF_BILLING_INVOICE");

    // Fill in the invoice number
    await this.page.locator('input[name="invoiceNo"]').click();
    await this.page.locator('input[name="invoiceNo"]').fill(invoiceSelfBilling);

    // Chooose Supplier
    await this.page.getByText('Please select Supplier').click();
    await this.page.locator('#react-select-2-input').fill(vendor);
    await this.page.locator('#react-select-2-input').press('Enter');

    // Find the row matching projectTitle and check its checkbox
    await this.page.waitForTimeout(500);
    const row = this.page.locator('.ag-row').filter({ hasText: projectTitle });
    await row.locator('.ag-checkbox-input-wrapper input').click();
  }

  async submitInvoice() {
    await this.page.getByRole('button', { name: 'Issue' }).click();
    await this.page.waitForLoadState("networkidle");
  }
}