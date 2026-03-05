# DRCCARS – Improvement Roadmap

## Completed ✓
- [x] Rebrand to DRCCARS
- [x] Branded DC logo mark & favicon
- [x] Server-side filtering
- [x] Next/Image for car thumbnails
- [x] Staggered section animations
- [x] Hero animation optimization
- [x] Card hover effects & testimonials polish
- [x] Custom 404 page
- [x] WhatsApp share + Copy link on listings
- [x] Mobile responsiveness (touch targets, safe areas, compare table)

---

## What's Next (recommended order)

1. **Favicon & PWA** – favicon.ico, apple-touch-icon, web app manifest
2. **SEO** – JSON-LD schema, metadataBase, robots.txt, sitemap.xml
3. **Error boundary** – Graceful error handling for runtime failures
4. **Skip-to-content** – Accessibility for keyboard users

---

## Responsiveness Audit ✓

| Device | Status | Notes |
|--------|--------|-------|
| **Phones (Android/iOS)** | ✓ | Mobile menu, sticky CTA, 44px touch targets, safe areas for notch |
| **Tablets** | ✓ | Responsive grids (2–3 cols), filters drawer on md |
| **Desktop** | ✓ | Sidebar filters, multi-column layouts |

**Pages checked:** Home, Browse, Car detail, Compare, Favorites, Dashboard, Login/Signup, FAQ, Legal (Terms, Privacy, Disclaimer), Sitemap, 404.

---

## High Priority

### 1. **Favicon & App Icons**
- Add explicit favicon.ico (browser tab)
- Add apple-touch-icon.png for iOS home screen
- Add web app manifest for PWA install

### 2. **404 & Error Pages**
- Custom 404 page with DRCCARS branding and link back to browse
- Error boundary for graceful failure handling

### 3. **SEO**
- Add JSON-LD structured data (Organization, WebSite) on home page
- Add Product/Car schema on listing pages for rich snippets
- Set `metadataBase` in layout for correct OG image URLs
- Add `robots.txt` and `sitemap.xml` for crawlers

### 4. **Share & Social**
- WhatsApp share button on car detail page (popular in DRC)
- Copy link button for listings

---

## Medium Priority

### 5. **Accessibility**
- Skip-to-content link for keyboard users
- Ensure all images have meaningful `alt` text
- ARIA labels on icon-only buttons

### 6. **Loading & Empty States**
- Skeleton screens for car detail page
- Better "no results" illustration or icon
- Loading state for meeting request form

### 7. **Forms & Validation**
- Client-side validation feedback on signup/login
- Clear error messages for failed actions
- Success feedback for RDV requests

### 8. **Mobile UX**
- Pull-to-refresh on browse page (where supported)
- Sticky "Contact seller" CTA on car detail when scrolled
- Larger tap targets for filter pills on mobile

---

## Lower Priority

### 9. **Analytics & Monitoring**
- Basic pageview analytics (privacy-respecting)
- Error tracking (e.g. Sentry)

### 10. **Performance**
- Blur placeholder for images while loading
- Preconnect to Supabase/Unsplash in `<head>`

### 11. **Content**
- Blog or news section for DRC car tips
- More FAQ entries based on user questions

### 12. **Features**
- Email alerts for saved searches
- Push notifications for new matching listings
- Dark/light theme toggle (beyond system preference)
