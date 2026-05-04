import { Page } from "@playwright/test";

export class ValidationPage {
  constructor(public page: Page) {}

  private valuationPage: Page | undefined;

  async navigateToReceipts() {
    await this.page.getByText("Receipts").click();
    await this.page.locator("a").filter({ hasText: "Progressive Claim" }).click();
    await this.page.getByRole("link", { name: "PC List" }).click();
    await this.page.waitForLoadState("networkidle");
  }

  async acknowledgeClaimDetails(projectTitle: string) {
    const [claimDetailPage] = await Promise.all([
      this.page.context().waitForEvent("page"),
      this.page.getByRole("gridcell", { name: projectTitle }).first().dblclick(),
    ]);
    await claimDetailPage.waitForLoadState("networkidle");

    // Click Acknowledge button on the new tab
    await claimDetailPage.getByRole("button", { name: "Acknowledge" }).click();
    await claimDetailPage.waitForLoadState("networkidle");
  }

  async fillValuationForm(projectTitle: string, prReference: string) {
    const [valuationPage] = await Promise.all([
      this.page.context().waitForEvent("page"),
      this.page.getByRole("gridcell", { name: projectTitle }).first().dblclick(),
    ]);
    this.valuationPage = valuationPage;

    await valuationPage.getByRole("textbox", { name: "Enter PR Reference No." }).click();
    await valuationPage.getByRole("textbox", { name: "Enter PR Reference No." }).fill(prReference);
    await valuationPage.waitForTimeout(500);
    await valuationPage.getByRole("gridcell", { name: /^(NA|STANDARD TAX)$/ }).first().click();
    await valuationPage.waitForTimeout(500);
    await valuationPage.getByRole("listbox").getByText("NA", { exact: true }).click();
    await valuationPage.waitForTimeout(500);
    await valuationPage.getByRole("button", { name: /Expand All/ }).first().click();
    await valuationPage.waitForTimeout(600);

    // Scroll to reveal the cumClaimAmt column in the valuation grid
    const gridContainer = '#panel1a-content > div > div:nth-child(2) > div > div > div > div';
    await valuationPage
      .locator(`${gridContainer} .ag-center-cols-clipper .ag-row:nth-child(1) .ag-cell`)
      .first()
      .hover();
    await valuationPage.mouse.wheel(4000, 0);
    await valuationPage.waitForTimeout(2000);

    // Click the checkbox in the 3rd column header
    await valuationPage
      .locator('#panel1a-content .ag-header-row.ag-header-row-column > div:nth-child(3) .p-checkbox-box')
      .click();
    await valuationPage.waitForTimeout(500);
  }

  async submitValuation() {
    const vp = this.valuationPage!;
    await vp.getByRole("button", { name: "Submit Valuation" }).click();
    await vp.waitForLoadState("networkidle");
    await vp.getByRole("button", { name: "I Understand" }).click();
    await vp.waitForLoadState("networkidle");
  }

  async responseIssue(projectTitle: string) {
    const [issuePage] = await Promise.all([
      this.page.context().waitForEvent("page"),
      this.page.getByRole("gridcell", { name: projectTitle }).first().dblclick(),
    ]);
    await issuePage.waitForLoadState("networkidle");
    await issuePage.getByRole("button", { name: "Issue" }).click();
    await issuePage.waitForLoadState("networkidle");
    await issuePage.getByRole("button", { name: "I Understand" }).click();
    await issuePage.waitForLoadState("networkidle");
  }
}
