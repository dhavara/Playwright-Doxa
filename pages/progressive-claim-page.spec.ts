import { Page } from "@playwright/test";

export interface ClaimData {
  contract_title: string;
  pc_reference:   string;
  claim_month:    string;
  claim_amount:   string;
}

export class ProgressiveClaimPage {
  constructor(private page: Page) {}

  async switchtoSupplierProfile() {
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
  }

  async navigateToReceipts() {
    await this.page.getByText("Receipts").click();
    await this.page.locator("a").filter({ hasText: "Progressive Claim" }).click();
    await this.page.getByRole("link", { name: "Create Claim" }).click();
    await this.page.waitForLoadState("networkidle");
  }

  async fillClaimForm(data: ClaimData) {
    // Find the row where Contract Title matches, then click its Claim button
    await this.page.locator('.ag-row').filter({ hasText: data.contract_title }).getByRole('button', { name: 'Claim' }).first().click();

    // PC Reference No.
    await this.page.getByRole('textbox', { name: 'Enter PC Reference No.' }).click();
    await this.page.getByRole('textbox', { name: 'Enter PC Reference No.' }).fill(data.pc_reference);

    // Claim Month
    await this.page.getByRole('textbox', { name: 'Please select Claim Month' }).click();
    await this.page.getByRole('option', { name: data.claim_month }).click();

    // Expand all rows in the claim grid
    await this.page.getByRole('button', { name: ' Expand All' }).first().click();
    await this.page.waitForTimeout(600);

    // Base container for the claim amounts grid
    const gridContainer = '#root > div.layout.layout--animations-enabled.layout--theme--light--primary > div.layout__wrap > div.layout__content > div > div:nth-child(5) > div > div';

    // Hover first cell then wheel-scroll to reveal cumClaimAmt column (triggers AG Grid column rendering)
    await this.page.locator(`${gridContainer} .ag-center-cols-clipper .ag-row:nth-child(1) .ag-cell`).first().hover();
    await this.page.mouse.wheel(3000, 0);
    await this.page.waitForTimeout(2000);

    // Count editable (non-group) rows in the cumClaimAmt column
    const cellCount = await this.page.locator(
      `${gridContainer} .ag-center-cols-clipper .ag-row:not(.ag-row-group) [col-id="cumClaimAmt"]`
    ).count();

    // Fill each row using the AG Grid API to open the editor
    for (let rowIndex = 0; rowIndex < cellCount; rowIndex++) {
      await this.page.evaluate(({ containerSel, rowIndex }) => {
        const container = document.querySelector(containerSel) as HTMLElement | null;
        const agRoot = container?.querySelector('.ag-root-wrapper') as HTMLElement | null;
        if (!agRoot) return;

        let el: HTMLElement | null = agRoot.parentElement;
        for (let d = 0; d < 5 && el; d++) {
          const fk = (Object.keys(el) as string[]).find(k =>
            k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
          );
          if (fk) {
            let node: any = (el as any)[fk];
            for (let depth = 0; depth < 10 && node; depth++) {
              const mp = node.memoizedProps;
              const sn = node.stateNode;
              for (const api of [mp?.api, mp?.gridOptions?.api, sn?.api, sn?.gridApi]) {
                if (api?.startEditingCell) {
                  api.startEditingCell({ rowIndex, colKey: 'cumClaimAmt' });
                  return;
                }
              }
              node = node.return;
            }
          }
          el = el.parentElement;
        }
      }, { containerSel: gridContainer, rowIndex });

      await this.page.waitForTimeout(400);
      const editorVisible = await this.page
        .getByRole('textbox', { name: 'Input Editor' })
        .isVisible();
      if (!editorVisible) continue;
      await this.page.getByRole('textbox', { name: 'Input Editor' }).fill(data.claim_amount);
      await this.page.getByRole('textbox', { name: 'Input Editor' }).press('Enter');
      await this.page.waitForTimeout(300);
    }
  }

  async submitClaim() {
    await this.page.getByRole('button', { name: 'Issue' }).click();
    await this.page.getByRole('button', { name: 'I Understand' }).click();
    await this.page.waitForLoadState("networkidle");
  }
}
