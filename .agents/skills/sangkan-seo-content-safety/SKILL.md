---
name: sangkan-seo-content-safety
description: >
  Protect Sangkan marketing SEO site content and bots. Use when editing
  cleaning-seo-website root HTML, blog, posts.json, generate_blog,
  upgrade_old_posts, seo.yml, social-bot, sitemaps, landings, or analytics.
  Trigger on GEO, posts.json overwrite, blog-bot, social-bot, cannibalization,
  or "บทความ/SEO/sitemap".
---

# Sangkan SEO Content Safety

Repo: `cleaning-seo-website` (static MPA + Python generators)

## Hard rules

1. **`seo.yml` is LOCKED** — refuse accidental overwrite of `posts.json` / GEO work unless user explicitly confirms `OVERWRITE`.
2. Prefer **blog-bot** + **upgrade-bot (GEO)** over unlocked SEO matrix regeneration.
3. Respect concurrency group `sangkan-site-content` (blog vs social).
4. **Do not** add React/Vite Topology, ERP dashboards, or heavy SPAs to public marketing HTML.
5. Quote form (`#quote` → FormSubmit) is lead capture only — not the ERP quotation system (`sangkan-clean`).
6. Keep Thai public copy; preserve JSON-LD / canonical / sitemap integrity when rebuilding.

## Main surfaces

- Content DB: `posts.json`, `posts/`, `blog/*.html`
- Build: `build_site.py` and related builders
- Bots: `.github/workflows/blog-bot.yml`, `upgrade-bot.yml`, `social-bot.yml`, `seo.yml`, `analytics-setup.yml`
- Config: `site_config.py`, `seo/keywords.json`, `seo/redirects.json`

## Dual-repo boundary

| Put in SEO repo | Put in `sangkan-clean` |
|-----------------|-------------------------|
| Landings, blog, bots, static SEO | CRM, QT, tax invoice, HR, topology |
| FormSubmit leads | Customer master + documents |

When linking CTA, point to LINE OA or `#quote` — do not invent deep links into private ERP unless deployed and intentional.
