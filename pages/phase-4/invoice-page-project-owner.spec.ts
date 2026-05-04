import { Page } from "@playwright/test";

export class InvoicePagePO {
  constructor(public page: Page) {}

  async navigateToReceipts() {
    await this.page.getByText("Receipts").click();
    await this.page.locator("a").filter({ hasText: "Progressive Claim" }).click();
    await this.page.getByRole("link", { name: "PC List" }).click();
    await this.page.waitForLoadState("networkidle");
  }

  //Add invoiceNo: string for Maincon to Project Owner flow
  async invoiceConversion(contractTitle: string, invoiceDate: string, invoiceNo: string) {
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

    //Type Invoice Number
    await newPage.waitForTimeout(800);
    await newPage.waitForSelector('input[name="invoiceNo"]');
    await newPage.locator('input[name="invoiceNo"]').click();
    await newPage.locator('input[name="invoiceNo"]').fill(invoiceNo);

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
    await this.page.waitForSelector('.ag-row', { timeout: 15000 });
    await this.page.evaluate(() => {
      [
        '.ag-body-horizontal-scroll-viewport',
        '.ag-center-cols-clipper > div',
        '.ag-center-cols-container',
      ].forEach(sel => {
        const el = document.querySelector(sel) as HTMLElement;
        if (el) {
          el.scrollLeft = 99999;
          el.dispatchEvent(new Event('scroll', { bubbles: true }));
        }
      });
    });
    await this.page.waitForTimeout(800);
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
