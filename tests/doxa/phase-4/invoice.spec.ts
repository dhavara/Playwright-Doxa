import { test } from "@playwright/test";
import { InvoicePage } from "../../../pages/phase-4/invoice-page.spec";
import { LoginPage2 } from "../../../pages/login.page.spec";
import data from "../../../data/data.json";

const ACTOR_KEYS = ["subcon_01", "main_con"] as const;
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

    const invoicePage = new InvoicePage(page);

    if (actorKey === "subcon_01") {
      await invoicePage.navigateToReceipts();
      await invoicePage.invoiceConversion(actor.claim.contract_title, actor.claim.invoice_date);
    } else if (actorKey === "main_con") {
      await invoicePage.approveInvoice(data.main_con.project_title);
    }
  });
}