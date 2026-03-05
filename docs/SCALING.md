# Image & Data Scaling Strategy (10k+ Photos)

This document outlines how DRCCARS handles growth to tens of thousands of car photos and listings.

---

## Current Setup

- **Storage**: Supabase Storage (public bucket for car images)
- **Images**: Stored as full-size uploads; displayed via `OptimizedCarImage` (Next.js Image for Supabase URLs, lazy loading)
- **Placeholders**: `CarImagePlaceholder` for listings without photos
- **Pagination**: Browse page uses cursor-based pagination (e.g. 24–48 per page)

---

## Short-Term (Free / Starter Plan)

1. **Lazy loading** – Already in place via `loading="lazy"` and Next.js Image
2. **Responsive `sizes`** – Grid uses `sizes` so browsers load appropriately sized images
3. **Pagination** – Limit results per page (e.g. 24–48) to avoid loading hundreds of images at once
4. **Placeholders** – `CarImagePlaceholder` for missing images reduces layout shift and improves perceived performance

---

## Medium-Term (Supabase Pro)

Supabase Pro includes **Image Transform** for Storage. Use it to serve thumbnails in grid views:

- **Endpoint**: `/storage/v1/object/public/` → `/storage/v1/render/image/public/`
- **Query params**: `?width=400&quality=80` for grid thumbnails
- **Helper**: `lib/image-utils.ts` → `getCarImageUrl(src, { width: 400 })`

Example:

```
Original:  https://xxx.supabase.co/storage/v1/object/public/cars/abc.jpg
Thumbnail: https://xxx.supabase.co/storage/v1/render/image/public/cars/abc.jpg?width=400&quality=80
```

Update `OptimizedCarImage` to use `getCarImageUrl()` for grid/list views when Pro is enabled.

---

## Long-Term (10k+ Images)

| Strategy | Description |
|----------|-------------|
| **CDN** | Put Supabase Storage behind a CDN (Cloudflare, etc.) for faster global delivery |
| **Thumbnail generation** | On upload, generate fixed-size thumbnails (e.g. 400×300) and store them; serve thumbnails in grids, full-size on detail page |
| **Database indexing** | Ensure `cars` table has indexes on `is_approved`, `created_at`, `make`, `province`, `price` for fast filtered queries |
| **Cursor pagination** | Keep cursor-based pagination; avoid `OFFSET` for large datasets |
| **Image optimization** | Enforce max dimensions/quality on upload (e.g. 1920×1080, 85% quality) to reduce storage and bandwidth |
| **Separate thumbnail bucket** | Optional: store thumbnails in a separate bucket for simpler cache rules |

---

## Checklist for Scale

- [ ] Pagination limits (24–48 per page)
- [ ] Lazy loading on all car images
- [ ] Placeholders for missing images
- [ ] Responsive `sizes` on images
- [ ] Supabase Pro Image Transform (when available)
- [ ] CDN in front of storage (optional)
- [ ] Thumbnail generation on upload (optional)
- [ ] Database indexes for common filters
