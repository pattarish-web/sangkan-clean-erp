---
name: sangkan-line-ops
description: >
  Guide work on Sangkan LINE Office Ops (cleaning-seo-website/ops). Use when
  editing webhook, LIFF, rich menus, Sheets schema, billing/slips, staff
  onboard, early-warning, check-in, or PoW. Trigger on LINE OA, CUS-/ST- ids,
  payments, generate-jobs, liff-booking/checkin/pow, or "บิล/สลิป/แม่บ้าน/จอง".
---

# Sangkan LINE Ops

Repo path: `cleaning-seo-website/ops/`  
Schema: `ops/shared/sheets/schema.md`

## Runtime

- Node webhook: `ops/webhook` — Messaging API + LIFF + REST
- Data: Google Sheets tabs `customers`, `staff`, `jobs`, `checkins`, `qc_photos`, `affiliate`, `payments`
- PoW media: Google Drive
- Roles: admin > staff > customer > guest (`ops/shared/roles.md`)

## Service chooser (must stay aligned with ERP Deal.type)

1. **bigclean** — Big Cleaning → landing / admin handoff  
2. **maid** — แม่บ้านประจำ → landing / admin handoff  
3. **office** — Sangkan Office packs S/M/L → rich menu + LIFF booking → Sheets

## Billing vs ERP documents

- LINE Ops billing = Flex + `payments` ledger + slip confirm (subscription/deposit)
- ERP (`sangkan-clean`) = QT / tax invoice / receipt for projects
- **Do not** treat Sheets payments as tax invoices
- ERP may push to **customer** `lineUserId` or **accounting group** — different purposes

## Staff / customer registration

- Customer: LIFF `/api/booking` → Sheets `customers` (`CUS-…`, `line_user_id`)
- Staff: `สมัครแม่บ้าน` / admin upsert → Sheets `staff` (`ST-…`)
- Bridge to ERP is optional `lineUserId` on ERP Customer/Employee — no full auto-sync required in spine round

## Safety

- Keep early-warning cron behavior; do not break signature validation
- Never commit secrets; use env from `ops/webhook/.env.example`
- Legal checklist mentioning Make.com is stale — webhook is source of truth
