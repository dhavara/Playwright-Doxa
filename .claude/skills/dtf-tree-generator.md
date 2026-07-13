---
name: dtf-tree-generator
description: Generate a DTF test-data tree as a data.json file for DOXA/DTF Playwright automation. Use this skill whenever the user asks to "make me a complex DTF tree", "generate a DTF tree", "create a DTF data.json", or otherwise wants a DTF-DHV-AUTO project data file with a project owner, main contractor, and multiple subcontractors. Trigger this even if the user only says "DTF tree" or "complex DTF" without spelling out "data.json" — this skill owns producing that file.
---
# DTF Tree Generator

Generates a `data.json` describing a DTF-DHV-AUTO test project tree: a fixed `doxa_admin` / `va_checker` / `project_owner` / `main_con` core, plus a configurable set of subcontractor blocks. Output is written directly as `data.json` (no separate script handed to the user).

## What the user provides

Read two parameters from the user's prompt each run:

1. **Project code number** — e.g. "006". Becomes `DTF-DHV-AUTO-006`. If the user gives a bare number like `6`, zero-pad to 3 digits (`006`).
2. **Tree structure** — who each contractor sub-contracts to. The user describes this as parent → children relationships. Each node with at least one child is a non-leaf (needs a `requisition` block); nodes with no children are leaves (claim only, no `requisition`).

If either is missing from the prompt, ask for it before generating. Do not invent a code number or a tree structure.

## What stays fixed

Credentials, the financial institution (ABC DTF), client/buyer IDs, proxypool, CIF, RSIDs, fees, currency, and all the `doxa_admin` / `va_checker` content stay exactly as in the reference. Only the project-code number varies, and it flows into every `project_code`, `project_label`, reference string (`PR-`, `PC-`), invoice number, and project title.

Note on titles: every project title's trailing number should equal the project code number (e.g. code `006` → "DTF DHV Auto Project - Owner 006").

## Vendor Name List

| Role | Vendor Name |
| --- | --- |
| Maincon | MAINCON PTE LTD |
| Subcon 1 | SUBCON 01 PTE LTD |
| Subcon 2 | SUBCON 02 PTE LTD |
| Subcon 3 | SUBCON 03 PTE LTD |
| Subcon 4 | SUBCON 04 PTE LTD |
| Subcon 5 | SUBCON 05 PTE LTD |
| Subcon 6 | SUBCON 06 PTE LTD |
| Subcon 7 | SUBCON 07 PTE LTD |
| Subcon 8 | SUBCON 08 PTE LTD |
| Subcon 9 | SUBCON 09 PTE LTD |
| Subcon 10 | SUBCON 10 PTE LTD |
| Subcon 11 | SUBCON 11 PTE LTD |
| Subcon 12 | SUBCON 12 PTE LTD |
| Subcon 13 | SUBCON 13 PTE LTD |
| Subcon 14 | SUBCON 14 PTE LTD |
| Subcon 15 | SUBCON 15 PTE LTD |
| Subcon 16 | SUBCON 16 PTE LTD |
| Subcon 17 | SUBCON 17 PTE LTD |
| Subcon 18 | SUBCON 18 PTE LTD |
| Subcon 19 | SUBCON 19 PTE LTD |

## Vendor Connections

Who each contractor can sub-contract to (their allowed vendors):

| Contractor | Vendors |
| --- | --- |
| Maincon | Subcon 01, Subcon 02, Subcon 03, Subcon 04, Subcon 05 |
| Subcon 01 | Subcon 02, Subcon 03, Subcon 04, Subcon 05, Subcon 06, Subcon 07, Subcon 08, Subcon 13 |
| Subcon 02 | Subcon 03, Subcon 04, Subcon 05, Subcon 07, Subcon 08, Subcon 09, Subcon 10, Subcon 14, Subcon 15, Subcon 17 |
| Subcon 03 | Subcon 04, Subcon 09, Subcon 11, Subcon 12, Subcon 16, Subcon 18, Subcon 19 |
| Subcon 04 | Subcon 05 |
| Subcon 05 | Subcon 06 |
| Subcon 06 | Subcon 08, Subcon 09, Subcon 10, Subcon 13 |
| Subcon 07 | Subcon 09, Subcon 10, Subcon 11 |
| Subcon 08 | Subcon 10 |
| Subcon 09 | Subcon 14, Subcon 15, Subcon 17 |
| Subcon 10 | — |
| Subcon 11 | Subcon 16, Subcon 18, Subcon 19 |
| Subcon 12 | — |
| Subcon 13 | — |
| Subcon 14 | Subcon 17 |
| Subcon 15 | — |
| Subcon 16 | Subcon 18, Subcon 19 |
| Subcon 17 | — |
| Subcon 18 | — |
| Subcon 19 | — |

## Subcon structure

- Keys are `subcon_01`, `subcon_02`, `subcon_06`, … — keyed by the actual subcon number, not position in file.
- Emails match the key number: `subcon_01@mailsac.com`, `subcon_06@mailsac.com`, etc.
- `project_code` suffixes match the actual subcon number: `-SC1`, `-SC2`, `-SC6`, `-SC13`, …

## Requisition `vendors` field

Every non-leaf actor's `requisition` block uses a `vendors` **array** listing **all direct children**. A node with one child still uses an array with one element:

```json
"requisition": {
  ...
  "vendors": ["SUBCON_01 (SUBCON 01 PTE LTD)", "SUBCON_02 (SUBCON 02 PTE LTD)", "SUBCON_03 (SUBCON 03 PTE LTD)"]
}
```

Vendor string format rules:

- `project_owner` → `main_con`: `"MAINCON01 (MAINCON PTE LTD)"`
- `main_con` → subcon: `"SUBCON_NN (SUBCON NN PTE LTD)"` — underscore, zero-padded
- subcon → sub-subcon: `"SUBCON NN (SUBCON NN PTE LTD)"` — space, zero-padded

Leaf nodes have **no** `requisition` **block** at all — only a `claim` block.

## How to generate

Write the `data.json` file directly. Do not reference an external script. Follow this order:

1. `doxa_admin` — fixed block, copy exactly from reference
2. `project_owner` — `vendors: ["MAINCON01 (MAINCON PTE LTD)"]`
3. `main_con` — `vendors` lists all direct subcon children
4. Each subcon in tree order — non-leaves include `requisition.vendors` with all their direct children; leaves have only a `claim` block

After writing the file, generate a report `.md` summarising the tree (actor list, vendor connections, ASCII tree, mermaid diagram, requisition details, claim details).