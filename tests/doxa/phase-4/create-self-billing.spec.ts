import { test } from "@playwright/test";
import { CreateSelfBillingPage } from "../../../pages/create-self-billing-page.spec";
import { LoginPage3 } from "../../../pages/login.page.spec";
import data from "../../../data/data.json";

const ACTOR_KEYS = ["project_owner"] as const;
type ActorKey = (typeof ACTOR_KEYS)[number];

for (const actorKey of ACTOR_KEYS) {
  const actor = data[actorKey];

  if (!actor.run_test) {
    test.skip(`TC-11 - ${actorKey}: Create Self-Billing Invoice`, () => {});
    continue;
  }

  test(`TC-11 - ${actorKey}: Create Self-Billing Invoice`, async ({ page }) => {
    test.setTimeout(120000);

    const loginPage = new LoginPage3(page);
    await loginPage.goto();
    await loginPage.login(actor.credentials.email, actor.credentials.password);
    await loginPage.waitForDashboard();

    const createSelfBillingPage = new CreateSelfBillingPage(page);
    await createSelfBillingPage.createSelfBilling(actor.claim.invoice_self_billing, actor.requisition.vendor, actor.project_title);
    await createSelfBillingPage.submitInvoice();
  });

}