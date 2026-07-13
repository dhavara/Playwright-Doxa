import { Page } from "@playwright/test";

export class AcknowledgeResponseIssuePage {
  constructor(public page: Page) {}

  async acknowledgeResponseIssue(contractTitle: string) {
    // Navigate directly to the subcon WO list
    await this.page.goto(
      "https://subcon-uat.doxa-holdings.com/progressive-claim/list",
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

    // Click Acknowledge button
    await newPage.getByRole("button", { name: "Acknowledge" }).click();

    // Confirm with I Understand
    await newPage.getByRole("button", { name: "I Understand" }).click();
    await newPage.waitForLoadState("networkidle");
  }
}