# Sangkan Clean ERP — คู่มือย้ายเครื่อง / Machine Setup

โปรเจกต์นี้พก **สกิลเอเจนต์ + สเปกออกแบบ** ไว้ใน repo แล้ว ไม่ต้องพึ่งแค่ `~/.cursor` บนเครื่องเก่า

## สิ่งที่อยู่ในโปรเจกต์

| path | ความหมาย |
|------|----------|
| `.agents/skills/` | สกิลภายนอก + สกิลธุรกิจ (ติดตั้งแล้ว) |
| `.cursor/skills/sangkan-*` | สกิลธุรกิจสำหรับ Cursor (ย้ายเครื่องมากับ git) |
| `docs/superpowers/specs/2026-07-12-erp-spine-redesign-design.md` | สเปก ERP UX 10/10 |
| `docs/assets/` | ภาพเทคนิค / mockup Topology |
| `scripts/restore-agent-skills.ps1` | สคริปต์ติดตั้งสกิลภายนอกใหม่บนเครื่องใหม่ |
| `AGENTS.md` | สรุปให้เอเจนต์อ่านตอนเปิดโปรเจกต์ |
| `.agents/skills/README.md` | รายการสกิล |

## ย้ายเครื่อง (checklist)

1. Clone / copy repo `sangkan-clean` และ `cleaning-seo-website`
2. ติดตั้ง Node 20+ และ dependency ตามปกติ (`npm install`)
3. รันสคริปต์สกิล (ถ้า `.agents/skills` หายหรืออยากรีเฟรชของภายนอก):

```powershell
cd sangkan-clean
powershell -ExecutionPolicy Bypass -File .\scripts\restore-agent-skills.ps1
```

4. คัดลอกสกิลธุรกิจขึ้น user (ทางเลือก — มีใน `.cursor/skills` ของโปรเจกต์แล้ว):

```powershell
$src = ".\.cursor\skills"
$dst = "$env:USERPROFILE\.cursor\skills"
New-Item -ItemType Directory -Force -Path $dst | Out-Null
Copy-Item "$src\sangkan-*" $dst -Recurse -Force
```

5. เปิดโฟลเดอร์ใน Cursor → **Developer: Reload Window**
6. ตรวจว่ามีสกิล `sangkan-erp-spine` ใน Agent skills

## คู่โปรเจกต์

ERP นี้อยู่คู่กับ `cleaning-seo-website` (SEO + LINE Ops)  
สกิล `sangkan-dual-repo` / `sangkan-line-ops` / `sangkan-seo-content-safety` อยู่ในทั้งสอง repo

## อย่า commit

- `.env*` (ยกเว้น example)
- `prisma/dev.db`
- `node_modules` / `.next`
