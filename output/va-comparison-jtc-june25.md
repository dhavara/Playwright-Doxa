# VA Verification Report — DTF-JTC-2025-06 (WR00000078)

> Compares **Expected VA** (calculated per `formula.md` Rule 4, recorded in `report-dtf-jtc-june25.md`) against **Card Limit** (the live system's computed value, captured in `output/va-tree-response-WR78.json`).

---

## Summary

| | Value |
|---|---|
| WR Number | WR00000078 (JTC004_DEV/MAINCON) |
| Total Nodes Compared | 17 (main_con + 16 subcons) |
| Exact Matches | **14** |
| Unexplained Mismatches | **3** (`main_con`, `subcon_07`, `subcon_13`) |
| Result | ⚠️ Mostly confirmed, with 3 flagged anomalies needing live-system investigation |

---

## Data Correction Found First

Before comparing, the live data revealed that `subcon_09`'s actual system `invoice_amount` is **8,004.96**, not 8,004.90 as originally supplied. Re-running Rule 4 with the corrected value resolves what initially looked like 3 separate "rounding mismatches" (`subcon_02`, `subcon_15`, `subcon_17`) into **exact** matches:

| Actor | Old expected (8004.90 basis) | Corrected expected (8004.96 basis) | System card_limit | Match |
|---|---|---|---|---|
| subcon_02 | 37.10 | **37.04** | 37.04 | ✅ |
| subcon_15 | 4447.17 | **4447.20** | 4447.20 | ✅ |
| subcon_17 | 3557.73 | **3557.76** | 3557.76 | ✅ |

All figures below use the corrected 8,004.96 basis.

---

## Second Discovery: Pending Children Still Count by Claim Amount

Five nodes in this tree (`subcon_08`, `subcon_13`, `subcon_16`, `subcon_17`, `subcon_19`) have `pc_status: "PENDING_CLAIM_ACKNOWLEDGEMENT"` and a **null** `invoice_amount` — their claim hasn't been formally acknowledged/invoiced yet. Despite that, their **parent's** children-sum calculation still includes them — using their `claim_amount` as a stand-in invoice value. This is confirmed by `subcon_02`'s exact match: `15042 − (7000 [subcon_08 claim] + 8004.96 [subcon_09 invoice]) = 37.04`, which only works if the pending `subcon_08`'s claim_amount (7000) is used, not 0.

Once this substitution rule is applied throughout, **4 of the 5 pending nodes themselves also match exactly** (`subcon_08`: 7000.00, `subcon_17`: 3557.76, `subcon_18`/`subcon_19`'s ancestor `subcon_16`: 0.00, `subcon_19`: 765.28) — proving the live system computes a provisional VA for pending nodes using their claim amount as a proxy invoice, consistent with Rule 4.

---

## Full Node-by-Node Comparison

| Actor | Vendor Name | Expected VA (Rule 4, corrected) | Card Limit (system) | Match |
|---|---|---|---|---|
| main_con | MAINCON PTE LTD | 16,044.80 | **0.00** | ❌ |
| subcon_01 | SUBCON 01 PTE LTD | 0 | 0.00 | ✅ |
| subcon_02 | SUBCON 02 PTE LTD | 37.04 | 37.04 | ✅ |
| subcon_03 | SUBCON 03 PTE LTD | 7,085.00 | 7,085.00 | ✅ |
| subcon_06 | SUBCON 06 PTE LTD | 0 | 0.00 | ✅ |
| subcon_07 | SUBCON 07 PTE LTD | 2,128.71 | **1,691.21** | ❌ |
| subcon_08 | SUBCON 08 PTE LTD | 7,000.00 | 7,000.00 | ✅ (pending, claim-proxy) |
| subcon_09 | SUBCON 09 PTE LTD | 0 | 0.00 | ✅ |
| subcon_11 | SUBCON 11 PTE LTD | 0 | 0.00 | ✅ |
| subcon_12 | SUBCON 12 PTE LTD | 904.70 | 904.70 | ✅ |
| subcon_13 | SUBCON 13 PTE LTD | 6,918.29 | **5,991.09** | ❌ (also pending) |
| subcon_14 | SUBCON 14 PTE LTD | 0 | 0.00 | ✅ |
| subcon_15 | SUBCON 15 PTE LTD | 4,447.20 | 4,447.20 | ✅ |
| subcon_16 | SUBCON 16 PTE LTD | 0 | 0.00 | ✅ (pending, claim-proxy) |
| subcon_17 | SUBCON 17 PTE LTD | 3,557.76 | 3,557.76 | ✅ (pending, claim-proxy) |
| subcon_18 | SUBCON 18 PTE LTD | 1,251.22 | 1,251.22 | ✅ |
| subcon_19 | SUBCON 19 PTE LTD | 765.28 | 765.28 | ✅ (pending, claim-proxy) |

---

## The 3 Unexplained Mismatches

### `main_con` — card_limit 0.00 vs expected 16,044.80

This is the most surprising result. `main_con` is **fully settled** (`pc_status: CONVERTED_TO_INVOICE`, `invoice_amount: 50140.00`, non-null `response_amount: 46000.00`), and every input to its VA formula (own invoice 50,140; children SC01/SC02/SC03 invoices 9,047 / 15,042 / 10,006.20, all confirmed and finalized) checks out exactly. Yet `card_limit` and `card_balance` both read `0.00`.

This breaks the pattern seen in every prior DTF-DHV-AUTO-006 comparison, where the root node always carried its correctly-computed VA (44,000 in July; 30,000 in August; 2,000 in September — all confirmed). Something about this specific WR (WR00000078) is different. Candidate explanations, none confirmed:
- The root's virtual card may not have been topped up / activated in this particular test run (note `virtual_card_number: "N/A"` for `main_con`, same as several other zero-or-low nodes).
- A possible system-side bug specific to this WR or a stale snapshot at the moment this response was captured.

### `subcon_07` — card_limit 1,691.21 vs expected 2,128.71 (off by exactly 437.50)

Every input checks out: `subcon_07` invoice 2,180.00 (confirmed), `subcon_01`'s ratio 83/85 (confirmed from its own invoice 9,047 against children 7,085 + 2,180 = 9,265). The expected funded value (2,180 × 83/85 = 2,128.71) does not match the system's 1,691.21. The gap (437.50) doesn't correspond to any other value in the tree — not a rounding issue, not explained by the pending-claim-proxy rule (subcon_07 itself is fully `CONVERTED_TO_INVOICE`, not pending).

### `subcon_13` — card_limit 5,991.09 vs expected 6,918.29

`subcon_13` is itself `PENDING_CLAIM_ACKNOWLEDGEMENT` with a null `invoice_amount`, like four other pending nodes. But unlike those four (which all matched once their claim amount was used as a proxy), `subcon_13`'s card_limit does **not** match `10000 (claim, proxy) × 0.691829 (subcon_06's ratio) = 6918.29`. This is the one pending node that breaks the otherwise-consistent claim-proxy pattern.

---

## Conservation Check

```
Sum of all Expected VA (corrected) = 16044.80+0+37.04+7085+0+2128.71+7000+0+0+904.70+6918.29+0+4447.20+0+3557.76+1251.22+765.28
                                    = 50,140.00  (= main_con's invoice — formula conserves correctly)

Sum of all System card_limit       = 0+0+37.04+7085+0+1691.21+7000+0+0+904.70+5991.09+0+4447.20+0+3557.76+1251.22+765.28
                                    = 32,730.50  (≠ 50,140.00 — system total does NOT conserve in this snapshot)
```

The system's own totals fail to conserve to the root invoice here — a further signal that `main_con`, `subcon_07`, and/or `subcon_13` reflect an inconsistent or stale state in this particular live snapshot, rather than a flaw in the Rule 4 formula itself (which conserves perfectly when applied to the same inputs).

---

## Conclusion

`formula.md` Rule 4 is reconfirmed for **14 of 17 nodes**, including the discovery and correct handling of two new edge cases not previously documented: (1) a small live-data correction (subcon_09's true invoice was 8004.96, not 8004.90), and (2) pending/unacknowledged children contribute their **claim amount** (not zero) to a parent's children-sum, and themselves report a provisional VA computed the same way. The 3 remaining mismatches (`main_con`, `subcon_07`, `subcon_13`) do not fit any pattern explainable from the data in this file — they're flagged as open anomalies for further investigation directly against the live system, not failures of the formula.
