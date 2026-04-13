import { test, expect } from '@playwright/test';
import { LoginPage2 } from '../../pages/login.page.spec';
import { RequisitionPage } from '../../pages/requisition.page.spec';
import data from '../../data/data.json';

const ACTOR_KEYS = ["project_owner"] as const;
type ActorKey = (typeof ACTOR_KEYS)[number];

for (const actorKey of ACTOR_KEYS) {
  const actor = data[actorKey];

  if (!actor.run_test) {
    test.skip(`TC-06 - ${actorKey}: Raise Requisition`, () => {});
    continue;
  }

test(`TC-06 - ${actorKey}: Raise Requisition`, async ({ page }) => {
  test.setTimeout(60000);

  const loginPage = new LoginPage2(page);
  await loginPage.goto();
  await loginPage.login(actor.credentials.email, actor.credentials.password);
  await loginPage.waitForDashboard();

  const requisitionPage = new RequisitionPage(page);
  await requisitionPage.navigateToRaiseRequisition();

  const requisitionData = {
    project_code:   actor.requisition.project_code,
    project_label:  actor.requisition.project_label,
    project_title:  actor.project_title,
    csv_filename:   actor.requisition.csv_filename,
    trade:          actor.requisition.trade,
    trade_label:    actor.requisition.trade_label,
    work_code:      actor.requisition.work_code,
    description:    actor.requisition.description,
    unit:           actor.requisition.unit,
    quantity:       actor.requisition.quantity,
    amount:         actor.requisition.amount,
    contract_title: actor.requisition.contract_title,
    contract_type:  actor.requisition.contract_type,
    retention_main: actor.requisition.retention_main,
    retention_sub:  actor.requisition.retention_sub,
    vendor:         actor.requisition.vendor,
  };

  await requisitionPage.requisitionInfo(requisitionData);
  await requisitionPage.uploadCSV(requisitionData);
  await requisitionPage.submitAndConfirm();

  await requisitionPage.convertToWorkOrder(requisitionData);
  await requisitionPage.navigateToWorkOrders();
  await requisitionPage.issueWorkOrder(requisitionData);
});
}