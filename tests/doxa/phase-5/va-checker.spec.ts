import {test} from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.use({
  launchOptions: {
    args: ['--auto-open-devtools-for-tabs'],
  },
});
import {VACheckerPage} from '../../../pages/phase-5/va-checker-page.spec';
import {LoginPage} from '../../../pages/login.page.spec';
import data from '../../../data/data_dhv11-august26.json';

const ACTOR_KEYS = ['doxa_admin'] as const;
type ActorKey = (typeof ACTOR_KEYS)[number];

for (const actorKey of ACTOR_KEYS) {
  const actor = data[actorKey];

  if (!actor.run_test) {
    test.skip(`TC-10 - ${actorKey}: Convert to Invoice`, () => {});
    continue;
  }

  test(`TC-11 - ${actorKey}: VA Checker`, async ({ page }) => {
    test.setTimeout(150000);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(actor.credentials.email, actor.credentials.password);
    await loginPage.waitForDashboard();

    const vaCheckerPage = new VACheckerPage(page);
    await vaCheckerPage.navigateToDTFTree();
    await vaCheckerPage.selectProjectOwner(data.va_checker);
    
    const { url, body } = await vaCheckerPage.selectVATree(data.va_checker);
    console.log(`\n[VA Tree API Key] ${url}`);
    console.log(JSON.stringify(body, null, 2));

    const outputPath = path.resolve(__dirname, '../../../output/va-tree-response.json');
    fs.writeFileSync(outputPath, JSON.stringify(body, null, 2));
  });
}