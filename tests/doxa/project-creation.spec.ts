import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages/login.page.spec";
import { ProjectPage } from "../../pages/project.page.spec";
import data from "../../data/data.json";

const ACTOR_KEYS = ["project_owner", "main_con", "subcon_01"] as const;
type ActorKey = (typeof ACTOR_KEYS)[number];

for (const actorKey of ACTOR_KEYS) {
  const actor = data[actorKey];

  if (!actor.run_test) {
    test.skip(`TC-04 - ${actorKey}: Create New Project`, () => {});
    continue;
  }

  test(`TC-04 - ${actorKey}: Create New Project`, async ({ page }) => {
    test.setTimeout(60000);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(actor.credentials.email, actor.credentials.password);
    await loginPage.waitForDashboard();

    const projectPage = new ProjectPage(page);
    await projectPage.navigateToProjectList();
    await projectPage.clickCreateNew();

    const projectData = {
      dtf_project_code: data.dtf_project_code,
      project_code: actor.project_code,
      project_title: actor.project_title,
      start_date: actor.start_date,
      end_date: actor.end_date,
      currency: actor.currency,
      currency_label: actor.currency_label,
      overall_budget: actor.overall_budget,
      project_address: actor.project_address,
      project_description: actor.project_description,
      overall_pic: actor.overall_pic,
      project_admin: actor.project_admin,
      team_members_count: actor.team_members_count,
    };

    await projectPage.ProjectInfo(projectData);
    await projectPage.ProjectMembers(projectData);
    await projectPage.submitAndConfirm();
  });
}
