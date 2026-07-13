# VA Verification Report — DTF-DHV-AUTO-006

> Compares **Expected VA** (manually calculated via the VA formula in `formula.md`, recorded in `report-dtf-006.md`) against **Card Limit** (the live system's computed value, captured in `output/va-tree-response.json` for WR00000251, claim month 2026-07).

---

## Summary

| | Value |
|---|---|
| WR Number | WR00000251 (WR-DTF-DHV-006-Dev to Maincon) |
| Claim Month | 2026-07 |
| Total Nodes Compared | 11 |
| Matches | 11 |
| Mismatches | 0 |
| Result | ✅ **All nodes match — system calculation confirms manual VA formula** |

---

## Node-by-Node Comparison

| Actor | Vendor Name | Expected VA (calculated) | Card Limit (system) | Match |
|---|---|---|---|---|
| main_con | MAINCON PTE LTD | 44,000 | 44,000 | ✅ |
| subcon_01 | SUBCON 01 PTE LTD | 2,000 | 2,000 | ✅ |
| subcon_02 | SUBCON 02 PTE LTD | 6,000 | 6,000 | ✅ |
| subcon_03 | SUBCON 03 PTE LTD | 7,000 | 7,000 | ✅ |
| subcon_06 | SUBCON 06 PTE LTD | 2,000 | 2,000 | ✅ |
| subcon_07 | SUBCON 07 PTE LTD | 2,000 | 2,000 | ✅ |
| subcon_08 | SUBCON 08 PTE LTD | 2,000 | 2,000 | ✅ |
| subcon_09 | SUBCON 09 PTE LTD | 5,000 | 5,000 | ✅ |
| subcon_10 | SUBCON 10 PTE LTD | 2,000 | 2,000 | ✅ |
| subcon_11 | SUBCON 11 PTE LTD | 6,000 | 6,000 | ✅ |
| subcon_12 | SUBCON 12 PTE LTD | 2,000 | 2,000 | ✅ |
| **Total** | | **80,000** | **80,000** | ✅ |

---

## Conservation Check

```
SUM(all card_limit) = 44000 + 2000 + 6000 + 7000 + 2000 + 2000 + 2000 + 5000 + 2000 + 6000 + 2000
                     = 80,000
main_con invoice_amount (root) = 80,000
✅ Conservation holds — system's card_limit values sum exactly to the root invoice.
```

---

## Mermaid Diagram (match status)

```mermaid
flowchart TD
    MC["🏗️ main_con
    Expected: 44,000 | System: 44,000 ✅"]

    SC01["🔧 subcon_01
    Expected: 2,000 | System: 2,000 ✅"]

    SC02["🔧 subcon_02
    Expected: 6,000 | System: 6,000 ✅"]

    SC03["🔧 subcon_03
    Expected: 7,000 | System: 7,000 ✅"]

    SC06["🍃 subcon_06
    Expected: 2,000 | System: 2,000 ✅"]

    SC07["🍃 subcon_07
    Expected: 2,000 | System: 2,000 ✅"]

    SC08["🍃 subcon_08
    Expected: 2,000 | System: 2,000 ✅"]

    SC09["🍃 subcon_09
    Expected: 5,000 | System: 5,000 ✅"]

    SC10["🍃 subcon_10
    Expected: 2,000 | System: 2,000 ✅"]

    SC11["🍃 subcon_11
    Expected: 6,000 | System: 6,000 ✅"]

    SC12["🍃 subcon_12
    Expected: 2,000 | System: 2,000 ✅"]

    MC --> SC01
    MC --> SC02
    MC --> SC03
    SC01 --> SC06
    SC01 --> SC07
    SC02 --> SC08
    SC02 --> SC09
    SC02 --> SC10
    SC03 --> SC11
    SC03 --> SC12

    style MC fill:#5ba85b,color:#fff
    style SC01 fill:#5ba85b,color:#fff
    style SC02 fill:#5ba85b,color:#fff
    style SC03 fill:#5ba85b,color:#fff
    style SC06 fill:#5ba85b,color:#fff
    style SC07 fill:#5ba85b,color:#fff
    style SC08 fill:#5ba85b,color:#fff
    style SC09 fill:#5ba85b,color:#fff
    style SC10 fill:#5ba85b,color:#fff
    style SC11 fill:#5ba85b,color:#fff
    style SC12 fill:#5ba85b,color:#fff
```

---

## Conclusion

The system's VA calculation engine (reflected in `card_limit` for each WR node in the live `dtfOverview` API response) is fully consistent with the manual VA formula (`VA = invoice − SUM(children invoices)`, leaf = own invoice) defined in `formula.md`. No discrepancies found across all 11 nodes in the DTF-DHV-AUTO-006 tree for claim month July 2026.
