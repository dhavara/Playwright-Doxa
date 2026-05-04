import { test, expect } from "@playwright/test";
import { LoginPage5 } from "../../../pages/login.page.spec";
import { FeeSetupPage } from "../../../pages/phase-1/fee-setup-page.spec";
import data from "../../../data/data.json";

const ACTOR_KEYS = ["doxa_admin"] as const;
type ActorKey = (typeof ACTOR_KEYS)[number];

for (const actorKey of ACTOR_KEYS) {
  const actor = data[actorKey];

  if (!actor.run_test) {
    test.skip(`TC-03 - ${actorKey}: Project Fee Setup`, () => {});
    continue;
  }

  test(`TC-03 - ${actorKey}: Project Fee Setup`, async ({ page }) => {
    test.setTimeout(60000);

    const loginPage = new LoginPage5(page);
    await loginPage.goto();
    await loginPage.login(actor.credentials.email, actor.credentials.password);
    await loginPage.waitForDashboard();

    const feeSetupPage = new FeeSetupPage(page);
    await feeSetupPage.navigateToFeeSetup(actor.financial_institution_label);
    await feeSetupPage.addProjectFee(data);
    await feeSetupPage.saveChanges();
  });
}