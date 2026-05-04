import { test } from "@playwright/test";
import { InvoicePagePO } from "../../../pages/phase-4/invoice-page-project-owner.spec";
import { LoginPage2 } from "../../../pages/login.page.spec";
import data from "../../../data/data.json";

const ACTOR_KEYS = ["main_con", "project_owner"] as const;
type ActorKey = (typeof ACTOR_KEYS)[number];

for (const actorKey of ACTOR_KEYS) {
  const actor = data[actorKey];

  if (!actor.run_test) {
    test.skip(`TC-10 - ${actorKey}: Convert to Invoice`, () => {});
    continue;
  }

  test(`TC-10 - ${actorKey}: Convert to Invoice`, async ({ page }) => {
    test.setTimeout(150000);

    const loginPage = new LoginPage2(page);
    await loginPage.goto();
    await loginPage.login(actor.credentials.email, actor.credentials.password);
    await loginPage.waitForDashboard();

    const invoicePage = new InvoicePagePO(page);

    if (actorKey === "main_con") {
      await invoicePage.navigateToReceipts();
      await invoicePage.invoiceConversion(actor.claim.contract_title, actor.claim.invoice_date, actor.claim.Invoice_number);
    } else if (actorKey === "project_owner") {
      await invoicePage.approveInvoice(actor.project_title);
    }
  });
}