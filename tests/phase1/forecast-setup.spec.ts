import { test, expect, Browser } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { ForecastPage } from '../../pages/forecast.page';
import batchData from '../../fixtures/batch_001_data.json';

const ACTOR_KEYS = ['project_owner', 'main_con', 'subcon_01', 'subcon_02'] as const;
type ActorKey = typeof ACTOR_KEYS[number];

for (const actorKey of ACTOR_KEYS) {
  const actor = batchData[actorKey];

  if (!actor.run_test) {
    test.skip(`Phase 1 - ${actorKey}: Forecast Setup`, () => {});
    continue;
  }

  test(`Phase 1 - ${actorKey}: Forecast Setup`, async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(actor.credentials.email, actor.credentials.password);
      await loginPage.waitForDashboard();

      const forecastPage = new ForecastPage(page);
      await forecastPage.navigateToForecast();
      await forecastPage.openProjectForecast(actor.project_code);
      await forecastPage.addTradeWithBudget(actor.overall_budget);
      await forecastPage.save();

      await expect(page.getByText(actor.overall_budget)).toBeVisible({ timeout: 15000 });
    } finally {
      await context.close();
    }
  });
}
