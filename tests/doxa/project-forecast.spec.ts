import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page.spec';
import { ForecastPage } from '../../pages/forecast.page.spec';
import data from "../../data/data.json";

const ACTOR_KEYS = ['project_owner', 'main_con', 'subcon_01'] as const;
type ActorKey = (typeof ACTOR_KEYS)[number];

for (const actorKey of ACTOR_KEYS) {
  const actor = data[actorKey];

  if (!actor.run_test) {
    test.skip(`TC-04 - ${actorKey}: Create New Project`, () => {});
    continue;
  }

test(`TC-05 - ${actorKey}: Forecast a Project`, async ({ page }) => {
  test.setTimeout(60000);

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(actor.credentials.email, actor.credentials.password);
  await loginPage.waitForDashboard();

  const forecastPage = new ForecastPage(page);
  await forecastPage.navigateToForecast();
  await forecastPage.openProjectForecast(actor.project_code);
  await forecastPage.addTradeWithBudget(actor.overall_budget);
  await forecastPage.save();
});
}