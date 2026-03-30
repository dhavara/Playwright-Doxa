import { test, expect, Browser } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { ProjectPage } from '../../pages/project.page';
import batchData from '../../fixtures/batch_001_data.json';

const ACTOR_KEYS = ['project_owner', 'main_con', 'subcon_01', 'subcon_02'] as const;
type ActorKey = typeof ACTOR_KEYS[number];

for (const actorKey of ACTOR_KEYS) {
  const actor = batchData[actorKey];

  if (!actor.run_test) {
    test.skip(`Phase 1 - ${actorKey}: Create Project`, () => {});
    continue;
  }

  test(`Phase 1 - ${actorKey}: Create Project`, async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(actor.credentials.email, actor.credentials.password);
      await loginPage.waitForDashboard();

      const projectPage = new ProjectPage(page);
      await projectPage.navigateToProjectList();
      await projectPage.clickCreateNew();
      await projectPage.fillProjectInfo({
        dtf_project_code: batchData.dtf_project_code,
        project_code: actor.project_code,
        project_title: actor.project_title,
        start_date: actor.start_date,
        end_date: actor.end_date,
        currency: actor.currency,
        overall_budget: actor.overall_budget,
        project_address: actor.project_address,
        project_description: actor.project_description,
        overall_pic: actor.overall_pic,
        project_admin: actor.project_admin,
        team_members_count: actor.team_members_count,
      });
      await projectPage.fillProjectMembers({
        dtf_project_code: batchData.dtf_project_code,
        project_code: actor.project_code,
        project_title: actor.project_title,
        start_date: actor.start_date,
        end_date: actor.end_date,
        currency: actor.currency,
        overall_budget: actor.overall_budget,
        project_address: actor.project_address,
        project_description: actor.project_description,
        overall_pic: actor.overall_pic,
        project_admin: actor.project_admin,
        team_members_count: actor.team_members_count,
      });
      await projectPage.submitAndConfirm();

      await expect(page.getByText(actor.project_code)).toBeVisible({ timeout: 15000 });
    } finally {
      await context.close();
    }
  });
}
