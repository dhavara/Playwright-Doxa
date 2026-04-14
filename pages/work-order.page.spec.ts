import { Page } from "@playwright/test";

export class WorkOrderPage {
  constructor(private page: Page) {}

  async navigateToWorkOrders() {
    await this.page.goto(
      "https://subcon-uat.doxa-holdings.com/work-order/list",
    );
    await this.page.waitForLoadState("networkidle");
  }

  async convertToWorkOrder(contractTitle: string) {
    // Double-click the first matching row using the first gridcell
    await this.page
      .getByRole("gridcell", { name: contractTitle })
      .first()
      .dblclick();

    // Opens in a new tab — wait for it and switch to it
    const newPage = await this.page.context().waitForEvent("page");
    await newPage.waitForLoadState("networkidle");

    // Click Convert to WO button
    await newPage.getByRole("button", { name: "Convert to WO" }).click();

    // Confirm the pop-up
    await newPage.getByRole("button", { name: "Yes" }).click();

    // Wait for the Convert to WO button to disappear — confirms conversion completed on server
    await newPage
      .getByRole("button", { name: "Convert to WO" })
      .waitFor({ state: "hidden", timeout: 30000 });
  }

  async issueWorkOrder(contractTitle: string) {
    // Double-click the first matching row using the first gridcell
    await this.page
      .getByRole("gridcell", { name: contractTitle })
      .first()
      .dblclick();

    // Opens in a new tab — wait for it and switch to it
    const newPage = await this.page.context().waitForEvent("page");
    await newPage.waitForLoadState("networkidle");

    // Click Issue button
    await newPage.getByRole("button", { name: "Issue" }).click();

    // Confirm the pop-up
    await newPage.getByRole("button", { name: "I Understand" }).click();
    await newPage.waitForLoadState("networkidle");
  }

  async acknowledgeWorkOrder(contractTitle: string) {
    // Navigate directly to the subcon WO list
    await this.page.goto(
      "https://subcon-uat.doxa-holdings.com/work-order/list",
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

    // Double-click the matching contract title row to open detail in a new tab
    await this.page
      .getByRole("gridcell", { name: contractTitle })
      .first()
      .dblclick();

    const newPage = await this.page.context().waitForEvent("page");
    await newPage.waitForLoadState("networkidle");

    // Click Acknowledge button
    await newPage.getByRole("button", { name: "Acknowledge" }).click();

    // Confirm with I Understand
    await newPage.getByRole("button", { name: "I Understand" }).click();
    await newPage.waitForLoadState("networkidle");

    // Close the new tab to return to the original page
    await newPage.close();

    // Switch back to Buyer profile after acknowledging
    if ((await toggle.getAttribute("aria-checked")) === "true") {
      await toggle.click();
      // Confirm the Switch Profile pop-up
      await this.page.getByRole("button", { name: "Yes" }).click();
      await this.page.goto(
        "https://subcon-uat.doxa-holdings.com/work-order/list",
      );
      await this.page.waitForLoadState("networkidle");
    }
  }
}
