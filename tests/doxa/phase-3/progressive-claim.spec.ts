import { test, expect } from "@playwright/test";
import { ProgressiveClaimPage } from "../../../pages/phase-3/progressive-claim-page.spec";
import { LoginPage2 } from "../../../pages/login.page.spec";
import data from "../../../data/data.json";

const ACTOR_KEYS = ["subcon_01", "main_con"] as const;
type ActorKey = (typeof ACTOR_KEYS)[number];

for (const actorKey of ACTOR_KEYS) {
  const actor = data[actorKey];

  if (!actor.run_test) {
    test.skip(`TC-07 - ${actorKey}: Create a Claim`, () => {});
    continue;
  }

  test(`TC-07 - ${actorKey}: Create a Claim`, async ({ page }) => {
    test.setTimeout(60000);

    const loginPage = new LoginPage2(page);
    await loginPage.goto();
    await loginPage.login(actor.credentials.email, actor.credentials.password);
    await loginPage.waitForDashboard();

    const progressiveClaimPage = new ProgressiveClaimPage(page);
    await progressiveClaimPage.switchtoSupplierProfile();

    const claimData = {
      contract_title: actor.claim.contract_title,
      pc_reference:   actor.claim.pc_reference,
      claim_month:    actor.claim.claim_month,
      claim_amount:   actor.claim.claim_amount,
    };

    await progressiveClaimPage.navigateToReceipts();
    await progressiveClaimPage.fillClaimForm(claimData);
    await progressiveClaimPage.submitClaim();
  });
}
