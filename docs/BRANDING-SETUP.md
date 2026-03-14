# Branding Setup: Logo, Favicon, Google Search & Emails

This guide helps fix the favicon in Google Search results and the logo in emails.

---

## 1. Current State

| Asset | Location | Status |
|-------|----------|--------|
| Favicon / Site icon | `app/icon.svg` + `public/icon.svg` | DRCCARS logo (DC + wheel) |
| Open Graph image | `/og-image.png` | **You need to add this** |
| Email logo | `https://drccars.com/logo.png` | **You need to add this** |

If you still see the Vercel arrow, it's usually due to **caching** (browser, CDN, Google). See §4 below.

---

## 2. Add Required Image Files

Place these files in the `public/` folder:

### `public/logo.png` (for emails)

- **Size:** ~120×40 px or similar (horizontal logo)
- **Usage:** Supabase email templates (confirm signup, reset password, magic link)
- **Where to update:** Supabase Dashboard → Authentication → Email Templates → edit each template Body. Replace `https://drccars.com/logo.png` if your logo URL is different.

To create from the DRCCARS icon:
1. Open `public/icon.svg` in a browser or design tool
2. Export as PNG (e.g. 120×40 or 240×80 for retina)
3. Save as `public/logo.png`

### `public/og-image.png` (for Google Search & social sharing)

- **Size:** 1200×630 px (recommended for Open Graph / social cards)
- **Usage:** When your site is shared on Google, Facebook, Twitter, etc.
- Design: Logo + tagline on your brand background, or a simple branded card.

---

## 3. Supabase Email Templates

1. Go to Supabase → **Authentication** → **Email Templates**
2. For **Confirm signup**, **Reset password**, **Magic link**: edit the Body HTML
3. Ensure the logo line is: `<img src="https://drccars.com/logo.png" alt="DRC Cars" width="120" height="40" style="height: 40px; width: auto;" />`
4. Replace the URL if your logo is at a different path (e.g. `https://drccars.com/icon.svg` or `https://yoursite.com/images/logo.png`)

---

## 4. Google Search Console – Favicon Still Wrong?

Google can take days or weeks to update favicons. To speed it up:

1. **Verify the favicon file:**
   - Visit `https://drccars.com/icon.svg` – it should return your DRCCARS logo (gold square with DC + wheel).
   - If you see 404 or Vercel icon, the wrong file is being served.

2. **Request re-indexing:**
   - Google Search Console → **URL Inspection** → enter `https://drccars.com`
   - Click **Request indexing**

3. **Clear caches:**
   - Redeploy on Vercel so the latest `app/icon.svg` / `public/icon.svg` is live
   - Use a private/incognito window to check the favicon

4. **Ensure one favicon per hostname:**  
   Google expects a single favicon per domain. Your metadata uses `/icon.svg`. Do not add conflicting favicon links.

---

## 5. Font Preload Warnings (Chrome DevTools)

If you see *"preloaded with link preload was not used within a few seconds"* for font files:

- These come from Next.js font optimization
- Usually safe to ignore; fonts load as needed
- If it bothers you, you can reduce the number of font families or weights in `app/layout.tsx`

---

## 6. Checklist

- [ ] `public/logo.png` exists (for emails)
- [ ] `public/og-image.png` exists (1200×630, for social/search)
- [ ] Supabase email templates use the correct logo URL
- [ ] `app/icon.svg` shows DRCCARS logo (not Vercel)
- [ ] `public/vercel.svg` removed (no longer needed)
- [ ] Site redeployed
- [ ] URL Inspection requested in Google Search Console
