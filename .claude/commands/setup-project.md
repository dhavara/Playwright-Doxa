# Setup New Project Data

You are helping the user prepare `data/data.json` for a new DTF test run and optionally run the project creation test.

## Steps

1. Ask the user for the following values (ask all at once):
   - **DTF project code** (e.g. `DTF-DHV-AUTO-005`)
   - **Run number suffix** (e.g. `005`) — used to generate all project codes and invoice numbers
   - **Start date** (YYYY-MM-DD)
   - **End date** (YYYY-MM-DD)
   - **Invoice date** (YYYY-MM-DD)
   - **Claim month** (e.g. `June`)
   - **Claim amount** for main_con and subcon_01 (e.g. `200`)
   - **jtc_setup** — `true` to run TC-11 (self-billing), `false` to run TC-10 (convert to invoice)

2. Using the answers, update `data/data.json` with:
   - `dtf_project_code` at root
   - `project_owner.project_code` → `DTF-DHV-AUTO-{suffix}-PO`
   - `project_owner.project_title` → `DTF DHV Auto Project - Owner {suffix}`
   - `project_owner.start_date`, `end_date`
   - `project_owner.claim.invoice_date`, `Invoice_number` → `INV-DTF-DHV-AUTO-{suffix}-PO-{month}`
   - `project_owner.claim.invoice_self_billing` → `INV-DTF-DHV-AUTO-{suffix}-{month}`
   - `project_owner.claim.pr_reference` → `PR-DTF-DHV-AUTO-{suffix}-PO`
   - `project_owner.jtc_setup`
   - `main_con.project_code` → `DTF-DHV-AUTO-{suffix}-MC`
   - `main_con.project_title` → `DTF DHV Auto Project - MainCon {suffix}`
   - `main_con.start_date`, `end_date`
   - `main_con.claim.invoice_date`, `Invoice_number` → `INV-DTF-DHV-AUTO-{suffix}-MC-{month}`
   - `main_con.claim.pr_reference` → `PR-DTF-DHV-AUTO-{suffix}-MC`
   - `main_con.claim.pc_reference` → `PC-DTF-DHV-AUTO-{suffix}-MC`
   - `main_con.claim.claim_month`, `claim_amount`
   - `main_con.requisition.project_code` and `project_label` → `DTF-DHV-AUTO-{suffix}-MC`
   - `subcon_01.project_code` → `DTF-DHV-AUTO-{suffix}-SC1`
   - `subcon_01.project_title` → `DTF DHV Auto Project - Subcon 01 {suffix}`
   - `subcon_01.start_date`, `end_date`
   - `subcon_01.claim.invoice_date`, `Invoice_number` → `INV-DTF-DHV-AUTO-{suffix}-SC1-{month}`
   - `subcon_01.claim.pr_reference` → `PR-DTF-DHV-AUTO-{suffix}-SC1`
   - `subcon_01.claim.pc_reference` → `PC-DTF-DHV-AUTO-{suffix}-SC1`
   - `subcon_01.claim.claim_month`, `claim_amount`
   - `subcon_01.requisition.project_code` and `project_label` → `DTF-DHV-AUTO-{suffix}-SC1`

3. Show the user a summary of what was changed.

4. Ask if they want to run the project creation test now:
   - If yes, run: `npx playwright test tests/doxa/phase-1/create-project.spec.ts --headed`
