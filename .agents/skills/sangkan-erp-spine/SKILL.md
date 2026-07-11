---
name: sangkan-erp-spine
description: >
  Enforce Sangkan Clean ERP spine redesign (Approach A, UX 10/10). Use whenever
  editing sangkan-clean — Prisma schema, CRM, quotations, documents, jobs, HR,
  topology, sending docs to LINE, Deal types, or TypeScript migration of the
  core. Trigger on Customer/Deal/Quotation/Job/Document/Payment, STAGE_GRAPH,
  tax invoice, receipt, /settings/topology, or "ใบเสนอราคา/ใบกำกับ/ดีล".
---

# Sangkan ERP Spine

Repo: `sangkan-clean`  
Spec: `docs/superpowers/specs/2026-07-12-erp-spine-redesign-design.md`

## Hard rules

1. **Spine:** Customer → Deal → (Survey | Quotation | Job | Document | Payment | Expense)
2. **IDs required:** Never create sales documents with customer name only — need `customerId`. Quotation/Job/Survey need `dealId`.
3. **Deal.type** must match LINE chooser: `bigcleaning` | `maid` | `office` (not a single `recurring`).
4. **STAGE_GRAPH per type** — CRM columns only for that type; reject illegal stage moves.
5. **Send document:** primary = copy `/share` link (always works); secondary = LINE push to `customer.lineUserId`. Never confuse with accounting-group notify.
6. **New core code** under `src/lib`, `src/server`, `src/app/api` = TypeScript. UI copy stays Thai.
7. **Topology:** default = internal ERP happy path (~8 nodes); fold other groups; "ทั้งบ้าน" is a toggle, not default.

## Stage templates (day-1)

| type | CRM columns |
|------|-------------|
| bigcleaning | สำรวจ → ประเมิน → เสนอราคา → อนุมัติ → งาน → ส่งมอบ → วางบิล |
| maid | ดีลใหม่ → เสนอราคา/แพ็ค → อนุมัติ → รอบงาน → เอกสาร |
| office | ดีลใหม่ → แพ็ค S/M/L → เอกสาร |

## UX shortcuts (required)

- From customer: create Deal with service type
- In Deal/QT forms: quick-create Customer modal
- On Deal card: shortcuts to QT / send doc / job
- Go-live block: P0–P3 + P5 + P6a only (inventory polish / full topology house view can follow)

## Do not

- Put Topology or React Flow on the public SEO site
- Merge LINE Sheets ledger into ERP as one book in this round
- Force every Deal through full Big Cleaning stages
- Block copy-link when LINE is not linked
