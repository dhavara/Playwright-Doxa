import { test, expect } from "@playwright/test";
import { ValidationPage } from "../../../pages/phase-3/validation-page.spec";
import { LoginPage2 } from "../../../pages/login.page.spec";
import data from "../../../data/data.json";

const ACTOR_KEYS = ["main_con", "project_owner"] as const;
type ActorKey = (typeof ACTOR_KEYS)[number];

for (const actorKey of ACTOR_KEYS) {
  const actor = data[actorKey];

  if (!actor.run_test) {
    test.skip(`TC-08 - ${actorKey}: Validate Claim`, () => {});
    continue;
  }

  test(`TC-08 - ${actorKey}: Validate Claim`, async ({ page }) => {
    test.setTimeout(120000);

    const loginPage = new LoginPage2(page);
    await loginPage.goto();
    await loginPage.login(actor.credentials.email, actor.credentials.password);
    await loginPage.waitForDashboard();

    const validationPage = new ValidationPage(page);

    await validationPage.navigateToReceipts();
    await validationPage.acknowledgeClaimDetails(actor.project_title);
    await validationPage.fillValuationForm(actor.project_title,actor.claim.pr_reference);
    await validationPage.submitValuation();
    await validationPage.responseIssue(actor.project_title);
  });
}
