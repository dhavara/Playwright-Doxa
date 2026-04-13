import { test, expect } from '@playwright/test';
import { LoginPage2 } from '../../pages/login.page';
import { RequisitionPage } from '../../pages/requisition.page';
import { WorkOrderPage } from '../../pages/work-order.page';
import data from '../../data/data.json';

const ACTOR_KEYS = ["project_owner", "main_con","subcon_01"] as const;
type ActorKey = (typeof ACTOR_KEYS)[number];

for (let i = 0; i < ACTOR_KEYS.length; i++) {
  const actorKey = ACTOR_KEYS[i];
  const actor = data[actorKey];

  if (!actor.run_test) {
    test.skip(`TC-06 - ${actorKey}: Raise Requisition`, () => {});
    continue;
  }

  test(`TC-06 - ${actorKey}: Raise Requisition`, async ({ page }) => {
    test.setTimeout(60000);

    const loginPage = new LoginPage2(page);
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

    // Login
    await loginPage.goto();
    await loginPage.login(actor.credentials.email, actor.credentials.password);
    await loginPage.waitForDashboard();

    // Non-project_owner actors must acknowledge the previous actor's WO before raising their own
    if (actorKey !== 'project_owner') {
      const prevActorKey = ACTOR_KEYS[i - 1];
      const prevActor = data[prevActorKey];
      console.log(`[TC-06] Current actor: ${actorKey}`);
      console.log(`[TC-06] Previous actor: ${prevActorKey}`);
      console.log(`[TC-06] Acknowledging contract title: ${prevActor.requisition.contract_title}`);
      const workOrderPage = new WorkOrderPage(page);
      await workOrderPage.acknowledgeWorkOrder(prevActor.requisition.contract_title);
    }

    // Raise a requisition
    const requisitionPage = new RequisitionPage(page);
    await requisitionPage.navigateToRaiseRequisition();

    // Fill in requisition info, upload CSV, and submit
    await requisitionPage.requisitionInfo(requisitionData);
    await requisitionPage.uploadCSV(requisitionData);
    await requisitionPage.submitAndConfirm();

    // Convert the requisition to a work order, then issue it
    const workOrderPage = new WorkOrderPage(page);
    await workOrderPage.convertToWorkOrder(requisitionData.contract_title);
    await workOrderPage.navigateToWorkOrders();
    await workOrderPage.issueWorkOrder(requisitionData.contract_title);
  });
}