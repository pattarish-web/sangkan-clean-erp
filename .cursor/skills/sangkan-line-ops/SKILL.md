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
- Roles: admin > staff > customer > guest

## Service chooser (= ERP Deal.type)

1. bigclean 2. maid 3. office

## Billing vs ERP

LINE Sheets payments ≠ tax invoices. ERP documents live in sangkan-clean.
