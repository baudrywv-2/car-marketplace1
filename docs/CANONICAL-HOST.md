# Preferred host (canonical)

**Preferred origin:** `https://www.drccars.com`

## Why

- Live traffic already lands on **www** (apex returned a temporary redirect).
- Sitemap, robots, and `<link rel="canonical">` previously used `https://drccars.com`, so Google saw redirects / host mismatch.

## What the app does

1. `SITE_URL` / `normalizeSiteUrl()` always resolve production to `https://www.drccars.com`.
2. Middleware returns **308** from `drccars.com` → `www.drccars.com` (path + query preserved).
3. `vercel.json` also declares a permanent host redirect (belt-and-suspenders on Vercel).

## Checklist after deploy

1. Vercel env: `NEXT_PUBLIC_SITE_URL=https://www.drccars.com`
2. Vercel Domains: set **www.drccars.com** as primary; apex should redirect to www (permanent).
3. Supabase Auth → URL Configuration: Site URL + Redirect URLs include `https://www.drccars.com/**`
4. Google Search Console: use the **www** property (or domain property); request sitemap `https://www.drccars.com/sitemap.xml`
5. Spot-check:
   - `curl -sI https://drccars.com` → `308` / `301` Location: `https://www.drccars.com/`
   - Homepage canonical → `https://www.drccars.com`
   - `/robots.txt` Host + Sitemap use www
