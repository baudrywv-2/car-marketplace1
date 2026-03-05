# Pre-deploy checklist (Vercel + DRCCARS)

## Done in this pass

### 1. Sold listings
- **RLS**: Sold cars stay visible (migration `allow_sold_cars_visible.sql`).
- **Cars list & detail**: Sold badge on photo (overlay + corner pill) and a clear “Sold — This vehicle is no longer available” bar on the detail page.
- **Home “Recently viewed”**: Sold badge on compact cards when applicable.
- **Copy**: Seller “Mark as sold” confirmation now says the listing stays visible with a Sold badge.
- **Sitemap**: Only non-sold cars are included for SEO.

### 2. Admin ranking (boost)
- **DB**: `boost_score` (integer, default 0) on `cars` (migration `add_listing_boost_ranking.sql`).
- **Admin**: In “Listings” tab, each listing has a “Boost” dropdown (0–5). Higher score = higher in browse.
- **Cars list**: Results ordered by `boost_score` DESC, then `created_at` DESC.

### 3. GDPR / legal
- **Cookie notice**: Bottom bar with short text, link to Privacy and “Accept”; choice stored in `localStorage` and bar hidden after accept.
- **Privacy / Terms / Disclaimer**: Already linked in footer and signup.

### 4. SEO
- **Root layout**: `metadataBase`, title, description, OG, keywords.
- **Car detail**: Dynamic title/description, OG image, **canonical** and **OG url** set to `/cars/[id]`.
- **Sitemap**: Static pages + non-sold car URLs; `robots.txt` allows crawl and points to sitemap; dashboard and API disallowed.

### 5. Performance / mobile
- **Next**: `optimizePackageImports` for Supabase; images AVIF/WebP.
- **Viewport**: `viewportFit: "cover"`, safe-area utilities.
- **Touch**: Buttons use min heights (e.g. 44px) where needed; mobile nav and filters already responsive.

### 6. AdSense readiness
- **AdPlacement**: Placeholder blocks with consistent height; replace with your AdSense script and `data-ad-slot` divs when approved.
- **Layout**: You can inject the AdSense script in `app/layout.tsx` and use `AdPlacement` for ad units.

---

## Before first Vercel deploy

1. **Run Supabase migrations** (in order):
   - `add_is_sold.sql` (if not already)
   - `allow_sold_cars_visible.sql`
   - `add_rdv_suggested_price.sql` (if not already)
   - `add_listing_boost_ranking.sql`

2. **Env on Vercel**: Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and any Stripe/API keys used in production.

3. **Optional**: Add Google AdSense script in `app/layout.tsx` and replace `AdPlacement` content with your ad unit markup when approved.

4. **Optional**: In Supabase, ensure RLS allows public read for approved non-draft cars (including sold) and that `boost_score` exists and is readable by anon if needed for the public cars query.

---

## Coherence / robustness

- **Sold**: Shown everywhere with the same “Sold” treatment; RLS and sitemap aligned.
- **Ranking**: Only admin can set `boost_score`; public only reads; order is deterministic (boost then date).
- **Cookie notice**: One-time accept; no tracking until user accepts; Privacy explains usage.
