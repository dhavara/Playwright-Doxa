import { test, expect } from "@playwright/test";
import { AcknowledgeResponseIssuePage } from "../../../pages/acknowledge-response-issue-page.spec";
import { LoginPage2 } from "../../../pages/login.page.spec";
import data from "../../../data/data.json";

const ACTOR_KEYS = ["subcon_01", "main_con"] as const;
type ActorKey = (typeof ACTOR_KEYS)[number];

for (const actorKey of ACTOR_KEYS) {
  const actor = data[actorKey];

  if (!actor.run_test) {
    test.skip(`TC-09 - ${actorKey}: Acknowledge Response Issue`, () => {});
    continue;
  }

  test(`TC-09 - ${actorKey}: Acknowledge Response Issue`, async ({ page }) => {
    test.setTimeout(120000);

    const loginPage = new LoginPage2(page);
    await loginPage.goto();
    await loginPage.login(actor.credentials.email, actor.credentials.password);
    await loginPage.waitForDashboard();

    const acknowledgeResponseIssuePage = new AcknowledgeResponseIssuePage(page);

    if (actorKey === "subcon_01" || actorKey === "main_con") {
      await acknowledgeResponseIssuePage.acknowledgeResponseIssue(actor.claim.contract_title);
    }
});
}