import { Page } from "@playwright/test";

export class InvoicePage {
  constructor(public page: Page) {}

  async navigateToReceipts() {
    await this.page.getByText("Receipts").click();
    await this.page.locator("a").filter({ hasText: "Progressive Claim" }).click();
    await this.page.getByRole("link", { name: "PC List" }).click();
    await this.page.waitForLoadState("networkidle");
  }

  //Add invoiceNo: string for Maincon to Project Owner flow
  async invoiceConversion(contractTitle: string, invoiceDate: string) {
    // Navigate directly to the subcon WO list
    await this.page.goto(
      "https://subcon-uat.doxa-holdings.com/progressive-claim/list"
    );
    await this.page.waitForLoadState("networkidle");

    // Switch profile to Supplier if not already active
    // p-inputswitch has aria-checked="true" when Supplier, "false" when Buyer
    const toggle = this.page.locator("div.p-inputswitch");
    const isSupplier = (await toggle.getAttribute("aria-checked")) === "true";

    if (!isSupplier) {
      await toggle.click();
      // Confirm the Switch Profile pop-up
      await this.page.getByRole("button", { name: "Yes" }).click();
      await this.page.waitForLoadState("networkidle");
    }

    // Scroll the AG Grid all the way to the right to reveal the contract title column
    await this.page.locator('.ag-body-horizontal-scroll-viewport').evaluate(el => el.scrollLeft = el.scrollWidth);

    // Double-click the matching contract title row to open detail in a new tab
    await this.page.getByRole("gridcell", { name: contractTitle }).first().dblclick();

    const newPage = await this.page.context().waitForEvent("page");
    await newPage.waitForLoadState("networkidle");

    // Click Convert To Invoice button
    await newPage.getByRole("button", { name: "Convert To Invoice" }).click();
    await newPage.waitForLoadState("networkidle");

    // Wait for the invoice dialog/form to appear (client-side modal, not a page navigation)
    await newPage.waitForSelector('input[name="invoiceDate"][type="date"]');

    // Fill in invoice date and issue
    await newPage.locator('input[name="invoiceDate"][type="date"]').click();
    await newPage.locator('input[name="invoiceDate"][type="date"]').fill(invoiceDate);
    await newPage.locator('input[name="invoiceDate"][type="date"]').press('Enter');
    await newPage.waitForTimeout(500);
    await newPage.getByRole('button', { name: 'Issue' }).click();
    await newPage.waitForLoadState("networkidle");
  }

  async approveInvoice(projectTitle: string) {
    await this.page.goto(
      "https://invoices-uat.doxa-holdings.com/invoice-pending-ap/list?invoiceCategory=PCINV"
    );
    await this.page.waitForLoadState("networkidle");

    // Hover over the grid and wheel scroll horizontally to reveal the Project Title column
    await this.page.locator('.ag-center-cols-clipper').hover();
    await this.page.waitForTimeout(500);
    await this.page.mouse.wheel(10000, 0);
    await this.page.waitForTimeout(600);
    await this.page.getByRole("gridcell", { name: projectTitle }).first().dblclick();

    const newPage = await this.page.context().waitForEvent("page");
    await newPage.waitForLoadState("networkidle");

    //Choose GL Account
    const glAccountRow = newPage.locator('div:nth-child(8) > div.col-md-8').first();
    await glAccountRow.locator('div[class*="IndicatorsContainer"]').click();
    await newPage.locator('div[class*="-option"]').first().click();

    // Click Approve button
    await newPage.getByRole("button", { name: "Approve" }).click();
  }
}
