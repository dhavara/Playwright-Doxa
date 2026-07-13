import { test } from "@playwright/test";
import { CreateSelfBillingPage } from "../../../pages/phase-4/create-self-billing-page.spec";
import { LoginPage3, LoginPage2 } from "../../../pages/login.page.spec";
import { InvoicePagePO } from "../../../pages/phase-4/invoice-page-project-owner.spec";
import data from "../../../data/data.json";

test(`TC-10 - project_owner: Create Self-Billing Invoice`, async ({ page }) => {
  test.skip(!data.project_owner.jtc_setup, 'jtc_setup is false');
  test.setTimeout(120000);

  const loginPage = new LoginPage3(page);
  await loginPage.goto();
  await loginPage.login(data.project_owner.credentials.email, data.project_owner.credentials.password);
  await loginPage.waitForDashboard();

  const createSelfBillingPage = new CreateSelfBillingPage(page);
  await createSelfBillingPage.createSelfBilling(data.project_owner.claim.invoice_self_billing, data.project_owner.requisition.vendor, data.project_owner.project_title);
  await createSelfBillingPage.submitInvoice();
});

test(`TC-11: Convert to Invoice`, async ({ page }) => {
  test.skip(data.project_owner.jtc_setup, 'jtc_setup is true');
  test.setTimeout(300000);

  // main_con: convert to invoice
  const loginPageMC = new LoginPage2(page);
  await loginPageMC.goto();
  await loginPageMC.login(data.main_con.credentials.email, data.main_con.credentials.password);
  await loginPageMC.waitForDashboard();

  const invoicePageMC = new InvoicePagePO(page);
  await invoicePageMC.navigateToReceipts();
  await invoicePageMC.invoiceConversion(data.main_con.claim.contract_title, data.main_con.claim.invoice_date, data.main_con.claim.Invoice_number);

  // project_owner: approve invoice
  const loginPagePO = new LoginPage2(page);
  await loginPagePO.goto();
  await loginPagePO.login(data.project_owner.credentials.email, data.project_owner.credentials.password);
  await loginPagePO.waitForDashboard();

  const invoicePagePO = new InvoicePagePO(page);
  await invoicePagePO.approveInvoice(data.project_owner.project_title);
});