# VA Limit Verification Formula

This is the single source of truth for how the expected **VA Limit**
("Virtual Amount") is computed from invoice amounts. The arithmetic must live
only in `computeExpectedVaLimit` / `computeTree`. Never inline it in a test body.

---

## Terminology

- **Upstream party**: the party that *pays* (sits above in the payment chain).
- **Downstream party**: the party that *gets paid* (sits below).
- **Leaf node**: a party with no children (nothing below it).
- Each party has an **invoice amount** and the API returns a **card_limit** (the actual VA Limit).

---

## Rule 1 — Single downstream (confirmed)

```
VA Limit (upstream) = upstream invoice − downstream invoice
VA Limit (downstream leaf) = downstream invoice
```

## Rule 2 — Upstream-lower passthrough (confirmed)

When `upstream invoice < downstream invoice`:
```
VA Limit (upstream)   = 0
VA Limit (downstream) = upstream invoice   ← capped at what was passed down
```

## Rule 3 — Multi-branch (confirmed from API tree)

When a node fans out to **multiple children**:
```
VA Limit (node) = node invoice − SUM(each direct child's invoice)
VA Limit (leaf) = leaf invoice
```

Rule 3 subsumes Rules 1 and 2. For a single child it reduces to Rule 1/2.
**Confirmed** against the full API tree (levels 0–4, 14 nodes).

## Rule 4 — Cascading passthrough cap (confirmed 2026-06-19)

Rule 2's passthrough does not stop at the node that triggers it — the **funding
shortfall cascades down to every descendant**, proportionally. When a node's
funded invoice is less than its children's invoice sum, each child's own
funded invoice is scaled down by the same ratio before that child computes
its own VA (and the ratio cascades again into *its* children, multiplicatively).

```
fundedInvoice(root) = root invoice

For each node, given its fundedInvoice:
  childrenSum = SUM(child invoice, using each child's OWN declared invoice)

  if childrenSum == 0:                       # leaf
    VA(node) = fundedInvoice
    ratioToChildren = 1

  elif fundedInvoice >= childrenSum:         # fully funded
    VA(node) = fundedInvoice − childrenSum
    ratioToChildren = 1

  else:                                      # passthrough
    VA(node) = 0
    ratioToChildren = fundedInvoice / childrenSum

  for each child:
    fundedInvoice(child) = child invoice × ratioToChildren
```

Without this cascade, leaf VA is **overstated** by exactly the unfunded
shortfall whenever an ancestor is in passthrough — this breaks the
conservation property (`SUM(all VA) == root invoice`) that Rules 1–3 alone
do not guarantee once passthrough is involved.

**Confirmed** against DTF-DHV-AUTO-006, claim month 2026-08 (WR00000251):
two sibling subtrees both had a passthrough parent (`subcon_01`, `subcon_03`)
whose leaf children's `card_limit` matched only once the cascaded ratio was
applied — see worked example below.

```
subcon_01: invoice 4,000, children (subcon_06: 3,000 + subcon_07: 3,000) = 6,000
  → passthrough, ratioToChildren = 4000 / 6000 = 0.6667
  subcon_06: funded = 3,000 × 0.6667 = 2,000  → VA = 2,000  ✅ (matches card_limit)
  subcon_07: funded = 3,000 × 0.6667 = 2,000  → VA = 2,000  ✅ (matches card_limit)

subcon_03: invoice 9,000, children (subcon_11: 5,000 + subcon_12: 5,000) = 10,000
  → passthrough, ratioToChildren = 9000 / 10000 = 0.9
  subcon_11: funded = 5,000 × 0.9 = 4,500  → VA = 4,500  ✅ (matches card_limit)
  subcon_12: funded = 5,000 × 0.9 = 4,500  → VA = 4,500  ✅ (matches card_limit)
```

Conservation check: `30000(main_con) + 0(SC01) + 2000(SC02) + 0(SC03) + 2000(SC06) + 2000(SC07) + 3000(SC08) + 4000(SC09) + 3000(SC10) + 4500(SC11) + 4500(SC12) = 55,000` — matches the root invoice exactly.

## Rule 5 — Pending claims use claim_amount as a proxy invoice (confirmed 2026-06-19)

A node can have `pc_status: "PENDING_CLAIM_ACKNOWLEDGEMENT"` with `invoice_amount: null` — its claim has been submitted but not yet acknowledged/invoiced by its buyer. This does **not** mean it contributes 0 (or is excluded) from its parent's `childrenSum`. The live system substitutes the pending node's **`claim_amount`** wherever its (nonexistent) invoice amount would otherwise be used — both in the parent's `childrenSum` calculation, and in the pending node's own funded-invoice calculation if it is itself a passthrough recipient.

```
invoiceOrClaim(node) = node.invoice_amount ?? node.claim_amount
```

Use `invoiceOrClaim()` everywhere Rule 1–4 reference "invoice" (childrenSum, own VA, cascaded funding into further descendants).

**Confirmed** against DTF-JTC-2025-06 (WR00000078): `subcon_02`'s card_limit (37.04) only reconciles as `15042 − (7000 [subcon_08's claim_amount, pending] + 8004.96 [subcon_09's invoice_amount]) = 37.04`. Four of five pending nodes in that tree (`subcon_08`, `subcon_16`, `subcon_17`, `subcon_19`) matched exactly once this substitution was applied; their VA is provisional and may change once the claim is acknowledged.

**Open question:** one pending node (`subcon_13`) did *not* match even with this substitution — flagged as an unexplained anomaly, see `output/va-comparison-jtc-june25.md`. Two non-pending nodes in the same tree (`main_con`, `subcon_07`) also didn't match despite every input checking out; the system's own card_limit totals failed to conserve to the root invoice in that snapshot, suggesting a stale or inconsistent live-system state for those three nodes rather than a flaw in Rules 1–5.

---

## Reference implementation

```ts
import * as fs from 'fs';
import * as path from 'path';

// ── Types ────────────────────────────────────────────────────────────────────

interface WrNode {
  wr_uuid: string;
  parent_wr_uuid: string;
  level_id: number;
  data: {
    number: string;
    title: string;
    vendor_name: string;
    invoice_amount: number | null;   // null while pc_status is PENDING_CLAIM_ACKNOWLEDGEMENT
    claim_amount: number;             // Rule 5 fallback when invoice_amount is null
    card_limit?: number;
    va_type?: string;
  };
  card_limit: number;
  card_balance: number;
}

// Rule 5: use the invoice amount where available, else fall back to the claim
// amount (pending nodes haven't been invoiced yet but still count toward
// their parent's childrenSum, and compute their own VA the same way).
function invoiceOrClaim(node: WrNode): number {
  return node.data.invoice_amount ?? node.data.claim_amount;
}

interface ApiTree {
  wrs: WrNode[];
  edges: { source: string; target: string }[];
}

interface NodeResult {
  wr_uuid: string;
  wr_number: string;
  title: string;
  vendor_name: string;
  level_id: number;
  invoice_amount: number;
  children_invoice_sum: number;
  expected_va_limit: number;
  actual_va_limit: number;
  match: boolean;
  va_type: string;
}

// ── Core formula ─────────────────────────────────────────────────────────────

/**
 * Compute a node's VA and the funding ratio passed to its children.
 * Rule 4 (cascading passthrough, confirmed): when fundedInvoice < childrenSum,
 * VA = 0 and each child's own invoice is scaled by fundedInvoice/childrenSum
 * before that child runs this same calculation — the ratio cascades downward.
 */
function computeNodeVaAndRatio(
  fundedInvoice: number,
  childrenInvoiceSum: number,
): { va: number; ratioToChildren: number } {
  if (childrenInvoiceSum === 0) return { va: fundedInvoice, ratioToChildren: 1 };        // leaf
  if (fundedInvoice >= childrenInvoiceSum)
    return { va: fundedInvoice - childrenInvoiceSum, ratioToChildren: 1 };               // Rule 1 / Rule 3
  return { va: 0, ratioToChildren: fundedInvoice / childrenInvoiceSum };                  // Rule 2/4 passthrough
}

// ── Tree walker ──────────────────────────────────────────────────────────────

export function computeTree(apiTree: ApiTree): NodeResult[] {
  const { wrs } = apiTree;

  // Build children map (exclude self-loops)
  const childrenMap = new Map<string, WrNode[]>();
  for (const wr of wrs) {
    if (!childrenMap.has(wr.wr_uuid)) childrenMap.set(wr.wr_uuid, []);
    if (wr.parent_wr_uuid !== wr.wr_uuid) {
      const siblings = childrenMap.get(wr.parent_wr_uuid) ?? [];
      siblings.push(wr);
      childrenMap.set(wr.parent_wr_uuid, siblings);
    }
  }

  const root = wrs.find(wr => wr.parent_wr_uuid === wr.wr_uuid);
  if (!root) throw new Error('No root node found (expected a self-loop parent_wr_uuid)');

  const results: NodeResult[] = [];

  // `fundedInvoice` is this node's invoice after applying any funding ratio
  // cascaded down from an upstream passthrough (Rule 4). For the root, and
  // for any node under a fully-funded ancestor, fundedInvoice === own invoice.
  function walk(node: WrNode, fundedInvoice: number) {
    const children = childrenMap.get(node.wr_uuid) ?? [];
    const childrenInvoiceSum = children.reduce((sum, c) => sum + invoiceOrClaim(c), 0);
    const { va, ratioToChildren } = computeNodeVaAndRatio(fundedInvoice, childrenInvoiceSum);

    results.push({
      wr_uuid: node.wr_uuid,
      wr_number: node.data.number,
      title: node.data.title,
      vendor_name: node.data.vendor_name,
      level_id: node.level_id,
      invoice_amount: invoiceOrClaim(node),
      children_invoice_sum: childrenInvoiceSum,
      expected_va_limit: va,
      actual_va_limit: node.card_limit,
      match: va === node.card_limit,
      va_type: node.data.va_type ?? 'UNKNOWN',
    });

    for (const child of children) {
      walk(child, invoiceOrClaim(child) * ratioToChildren);
    }
  }

  walk(root, invoiceOrClaim(root));

  return results.sort((a, b) => a.level_id - b.level_id || a.vendor_name.localeCompare(b.vendor_name));
}

// ── Output generators ────────────────────────────────────────────────────────

export function generateMarkdown(results: NodeResult[], apiTree: ApiTree): string {
  const totalNodes = results.length;
  const mismatches = results.filter(r => !r.match);
  const totalInvoice = results.reduce((s, r) => s + r.invoice_amount, 0);
  const totalExpectedVA = results.reduce((s, r) => s + r.expected_va_limit, 0);

  // ── Summary ──
  let md = `# VA Limit Calculation Report\n\n`;
  md += `## Summary\n\n`;
  md += `| | Value |\n|---|---|\n`;
  md += `| Total nodes | ${totalNodes} |\n`;
  md += `| Total invoice amount | ${totalInvoice.toLocaleString()} |\n`;
  md += `| Total expected VA | ${totalExpectedVA.toLocaleString()} |\n`;
  md += `| Mismatches | ${mismatches.length} |\n\n`;

  if (mismatches.length === 0) {
    md += `> All ${totalNodes} nodes match. \n\n`;
  } else {
    md += `> **${mismatches.length} mismatch(es) found.**\n\n`;
  }

  // ── Table ──
  md += `## Node Results\n\n`;
  md += `| WR # | Vendor | Level | Invoice | Children Sum | Expected VA | Actual VA | Match |\n`;
  md += `|---|---|---|---|---|---|---|---|\n`;
  for (const r of results) {
    const tick = r.match ? '✅' : '❌';
    md += `| ${r.wr_number} | ${r.vendor_name} | ${r.level_id} `;
    md += `| ${r.invoice_amount.toLocaleString()} | ${r.children_invoice_sum.toLocaleString()} `;
    md += `| ${r.expected_va_limit.toLocaleString()} | ${r.actual_va_limit.toLocaleString()} | ${tick} |\n`;
  }
  md += `\n`;

  // ── Mermaid diagram ──
  md += `## Tree Diagram\n\n\`\`\`mermaid\nflowchart TD\n`;
  for (const r of results) {
    const label = `${r.wr_number}\\n${r.vendor_name.replace('PTE LTD','').trim()}\\nInv:${r.invoice_amount} VA:${r.expected_va_limit}`;
    const style = r.match ? '' : `\nstyle ${r.wr_uuid.substring(0,8)} fill:#ffcccc`;
    md += `  ${r.wr_uuid.substring(0,8)}["${label}"]${style}\n`;
  }

  // Edges (skip self-loops)
  const seenEdges = new Set<string>();
  for (const edge of apiTree.edges) {
    if (edge.source === edge.target) continue;
    const key = `${edge.source.substring(0,8)}->${edge.target.substring(0,8)}`;
    if (!seenEdges.has(key)) {
      seenEdges.add(key);
      md += `  ${edge.source.substring(0,8)} --> ${edge.target.substring(0,8)}\n`;
    }
  }
  md += `\`\`\`\n`;

  return md;
}

export function generateJson(results: NodeResult[]): string {
  return JSON.stringify({ generated_at: new Date().toISOString(), results }, null, 2);
}

// ── Entry point ───────────────────────────────────────────────────────────────

/**
 * Call this after loading the API tree JSON.
 * Writes:
 *   output/va-report.md   — summary + table + mermaid diagram
 *   output/va-results.json — machine-readable comparison
 */
export function runAndWrite(apiTree: ApiTree, outputDir = 'output'): NodeResult[] {
  fs.mkdirSync(outputDir, { recursive: true });
  const results = computeTree(apiTree);
  fs.writeFileSync(path.join(outputDir, 'va-report.md'), generateMarkdown(results, apiTree), 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'va-results.json'), generateJson(results), 'utf-8');
  return results;
}
```

---

## Edge cases

| Situation | Behaviour |
|---|---|
| Leaf node (no children) | VA Limit = own **funded** invoice amount (= own invoice, unless an ancestor is in passthrough) |
| Single downstream, upstream ≥ downstream | Rule 1: VA = upstream − downstream |
| Single downstream, upstream < downstream | Rule 2: upstream VA = 0, ratio cascades to downstream (Rule 4) |
| Multiple downstream children, funded ≥ childrenSum | Rule 3: VA = funded invoice − SUM(children invoices) |
| Multiple downstream children, funded < childrenSum | Rule 4: VA = 0; every child's funded invoice = child invoice × (funded/childrenSum), recursively |
| Self-loop edge in API tree | Ignored (root node references itself); root's `fundedInvoice` = its own invoice |
| Node has `invoice_amount: null` (pc_status PENDING_CLAIM_ACKNOWLEDGEMENT) | Rule 5: use `claim_amount` instead, everywhere invoice would be used — for that node's own VA, and for its contribution to its parent's childrenSum |

---

## Confirmed against API tree (2026-06-05)

| WR | Invoice | Children Sum | Expected VA | Actual card_limit | Match |
|---|---|---|---|---|---|
| Root (L0) | 85000 | 30000 | 55000 | 55000 | ✅ |
| SUBCON 02 (L1) | 15000 | 9000 | 6000 | 6000 | ✅ |
| SUBCON 03 (L1) | 15000 | 8000 | 7000 | 7000 | ✅ |
| SUBCON 08 (L2, leaf) | 2000 | 0 | 2000 | 2000 | ✅ |
| SUBCON 09 (L2) | 5000 | 3000 | 2000 | 2000 | ✅ |
| SUBCON 10 (L2, leaf) | 2000 | 0 | 2000 | 2000 | ✅ |
| SUBCON 11 (L2) | 6000 | 3000 | 3000 | 3000 | ✅ |
| SUBCON 12 (L2, leaf) | 2000 | 0 | 2000 | 2000 | ✅ |
| SUBCON 14 (L3) | 2000 | 1000 | 1000 | 1000 | ✅ |
| SUBCON 15 (L3, leaf) | 1000 | 0 | 1000 | 1000 | ✅ |
| SUBCON 16 (L3) | 3000 | 2000 | 1000 | 1000 | ✅ |
| SUBCON 17 (L4, leaf) | 1000 | 0 | 1000 | 1000 | ✅ |
| SUBCON 18 (L4, leaf) | 1000 | 0 | 1000 | 1000 | ✅ |
| SUBCON 19 (L4, leaf) | 1000 | 0 | 1000 | 1000 | ✅ |

---

## Confirmed against API tree (2026-06-19) — Rule 4 (cascading passthrough)

DTF-DHV-AUTO-006, WR00000251, claim month 2026-08. Before Rule 4 was added,
the naive Rule 1–3 formula mismatched on all 4 leaves below a passthrough
node; after applying the cascaded ratio, all 11 nodes match.

| WR | Own Invoice | Funded Invoice | Children Sum | Expected VA | Actual card_limit | Match |
|---|---|---|---|---|---|---|
| main_con (root) | 55000 | 55000 | 25000 | 30000 | 30000 | ✅ |
| subcon_01 (passthrough) | 4000 | 4000 | 6000 | 0 | 0 | ✅ |
| subcon_02 | 12000 | 12000 | 10000 | 2000 | 2000 | ✅ |
| subcon_03 (passthrough) | 9000 | 9000 | 10000 | 0 | 0 | ✅ |
| subcon_06 (leaf, under SC01) | 3000 | 2000 (×0.6667) | 0 | 2000 | 2000 | ✅ |
| subcon_07 (leaf, under SC01) | 3000 | 2000 (×0.6667) | 0 | 2000 | 2000 | ✅ |
| subcon_08 (leaf, under SC02) | 3000 | 3000 (×1) | 0 | 3000 | 3000 | ✅ |
| subcon_09 (leaf, under SC02) | 4000 | 4000 (×1) | 0 | 4000 | 4000 | ✅ |
| subcon_10 (leaf, under SC02) | 3000 | 3000 (×1) | 0 | 3000 | 3000 | ✅ |
| subcon_11 (leaf, under SC03) | 5000 | 4500 (×0.9) | 0 | 4500 | 4500 | ✅ |
| subcon_12 (leaf, under SC03) | 5000 | 4500 (×0.9) | 0 | 4500 | 4500 | ✅ |

Conservation: `SUM(all VA) = 55,000 = root invoice` ✅ — only holds once Rule 4's cascade is applied; the naive per-node formula (Rules 1–3 only) sums to 58,000.

---

## Confirmed against API tree (2026-06-19) — Rule 5 (pending claim_amount fallback) + open anomalies

DTF-JTC-2025-06, WR00000078. 17 nodes (main_con + 16 subcons), 5 of them pending
(`invoice_amount: null`). Applying Rule 5's `invoiceOrClaim()` fallback resolves
14 of 17 nodes to an exact match. 3 do not match and are **not** explained by
any rule here — flagged as open, not folded into the formula.

| WR | Invoice/Claim used | Funded | Children Sum | Expected VA | Actual card_limit | Match |
|---|---|---|---|---|---|---|
| main_con (root) | 50140 | 50140 | 34095.20 | 16044.80 | **0.00** | ❌ open |
| subcon_01 (passthrough) | 9047 | 9047 | 9265.00 | 0 | 0.00 | ✅ |
| subcon_02 | 15042 | 15042 | 15004.96 | 37.04 | 37.04 | ✅ |
| subcon_03 | 10006.20 | 10006.20 | 2921.20 | 7085.00 | 7085.00 | ✅ |
| subcon_06 (passthrough) | 7085 | 6918.29 | 10000.00 (claim, pending child) | 0 | 0.00 | ✅ |
| subcon_07 (leaf) | 2180 | 2128.71 | 0 | 2128.71 | **1691.21** | ❌ open |
| subcon_08 (leaf, pending) | 7000 (claim) | 7000.00 | 0 | 7000.00 | 7000.00 | ✅ |
| subcon_09 (passthrough) | 8004.96 | 8004.96 | 9810.00 | 0 | 0.00 | ✅ |
| subcon_11 (passthrough) | 2016.50 | 2016.50 | 4000.00 (claim, pending child) | 0 | 0.00 | ✅ |
| subcon_12 (leaf) | 904.70 | 904.70 | 0 | 904.70 | 904.70 | ✅ |
| subcon_13 (leaf, pending) | 10000 (claim) | 6918.29 | 0 | 6918.29 | **5991.09** | ❌ open |
| subcon_14 (passthrough) | 4360 | 3557.76 | 5000.00 (claim, pending child) | 0 | 0.00 | ✅ |
| subcon_15 (leaf) | 5450 | 4447.20 | 0 | 4447.20 | 4447.20 | ✅ |
| subcon_16 (passthrough, pending) | 4000 (claim) | 2016.50 | 5270.00 | 0 | 0.00 | ✅ |
| subcon_17 (leaf, pending) | 5000 (claim) | 3557.76 | 0 | 3557.76 | 3557.76 | ✅ |
| subcon_18 (leaf) | 3270 | 1251.22 | 0 | 1251.22 | 1251.22 | ✅ |
| subcon_19 (leaf, pending) | 2000 (claim) | 765.28 | 0 | 765.28 | 765.28 | ✅ |

Conservation: expected total = 50,140.00 (= root invoice, formula conserves). System total = 32,730.50 (≠ root invoice) — the system's own numbers don't conserve in this snapshot either, reinforcing that the 3 mismatches reflect a stale/inconsistent live state rather than a gap in Rules 1–5. Full detail in `output/va-comparison-jtc-june25.md`.
