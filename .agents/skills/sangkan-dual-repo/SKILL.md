---
name: sangkan-dual-repo
description: >
  Route work between Sangkan's two repos. Use at the start of tasks that might
  touch marketing site, LINE ops, or ERP, or when the user says Topology,
  ใบเสนอราคา, บอท, or "ระบบทั้งบ้าน". Prevents editing the wrong codebase.
---

# Sangkan Dual Repo Map

| Repo | Path | Owns |
|------|------|------|
| Marketing + bots + LINE Ops | `cleaning-seo-website` | Static SEO, blog bots, social bot, `ops/webhook`, Sheets |
| ERP back office | `sangkan-clean` | CRM, quotations, tax/receipt, HR, inventory, topology UI |

## Pick repo first

- Document / CRM / HR / Topology page → **sangkan-clean** + skill `sangkan-erp-spine`
- LINE webhook / LIFF / Sheets jobs / early-warning → **cleaning-seo-website/ops** + skill `sangkan-line-ops`
- Blog HTML / posts.json / landings / GEO → **cleaning-seo-website** + skill `sangkan-seo-content-safety`

## Shared concepts (not shared databases)

- LINE services: bigclean / maid / office ↔ ERP `Deal.type`
- People may share `lineUserId` later; no automatic sync required for spine go-live
- Same brand / OA token possible; different jobs (broadcast vs ops vs doc push)
