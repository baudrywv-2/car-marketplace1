# Full Marketplace App Template (Reusable)

A comprehensive template extracted from the car marketplace app. Use for housing, jobs, services, or any listing-based marketplace. **This document does not modify your car project** — it serves as a reference for new projects.

---

## 1. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16+ (App Router) |
| Language | TypeScript |
| Database / Auth | Supabase |
| Styling | Tailwind CSS 4 |
| Fonts | Inter, JetBrains Mono, custom display font |

---

## 2. App Structure

```
app/
├── layout.tsx              # Root layout, fonts, metadata
├── page.tsx                # Home page (featured, search quick)
├── globals.css
├── components/             # Shared UI
├── contexts/               # LocaleContext, ToastContext
├── api/                    # API routes
├── login/                  # Auth pages
├── signup/
├── reset-password/
├── dashboard/              # Role-based dashboards
│   ├── page.tsx            # Router → admin / seller / buyer
│   ├── admin/
│   ├── seller/
│   ├── buyer/
│   ├── settings/
│   └── cars/               # Create / edit listings
│       ├── new/
│       └── [id]/edit/
├── cars/                   # Public listings (replace with your entity)
│   ├── page.tsx            # Browse, search, filter
│   └── [id]/               # Listing detail
│       ├── page.tsx
│       └── success/
├── favorites/              # User favorites
├── compare/                # Compare multiple items
├── seller/[id]/            # Public seller profile
├── rent/                   # Rental-specific (optional)
├── faq/ | terms/ | privacy/ | disclaimer/
├── site-map/
└── not-found.tsx | error.tsx
```

---

## 3. Auth & Roles

| Role | Access |
|------|--------|
| **Public** | Browse listings, view detail (no contact) |
| **Buyer** | Favorites, meeting requests, compare |
| **Seller** | Create/edit own listings, see approved requests |
| **Admin** | Approve/reject listings, manage requests, users, analytics |

**Role flow:**
- `profiles.role` = `'buyer'` | `'seller'` | `'admin'`
- `/dashboard` → redirect by role to `/dashboard/admin`, `/dashboard/seller`, or `/dashboard/buyer`
- `is_admin()` RLS helper: `SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')`

---

## 4. Database Schema (Generic)

### Core Tables

| Table | Purpose |
|-------|---------|
| `auth.users` | Supabase Auth (built-in) |
| `profiles` | id, full_name, phone, role, company_name, etc. (id = auth.users.id) |
| `listings` | Main entity (cars, houses, jobs). Has owner_id → profiles |
| `favorites` | user_id, listing_id (UNIQUE) |
| `meeting_requests` | Requester → listing, admin approves, seller sees approved |
| `car_views` | Optional: page view tracking per listing |
| `search_logs` | Optional: keyword/make/location analytics |
| `admin_messages` | Admin broadcasts to sellers/buyers |

### listings (Generic)

```sql
-- Adapt columns to your domain (cars: make, model, mileage; housing: beds, baths, sqft)
id uuid PK, owner_id uuid FK→profiles, title text, description text, price numeric,
currency text, images text[], is_approved boolean, is_draft boolean,
province text, city text, created_at timestamptz, ...
```

### favorites

```sql
id uuid PK, user_id uuid FK→auth.users, listing_id uuid FK→listings,
UNIQUE(user_id, listing_id)
```

### meeting_requests (see TEMPLATE-MEETING-REQUESTS-REUSABLE.md)

```sql
id, listing_id, requester_id FK→profiles, requester_email, requester_name, requester_phone,
message, preferred_date, suggested_price, status ('pending'|'approved'), created_at
```

---

## 5. RLS Principles

- **profiles**: Users read/update own only; admin reads all
- **listings**: Public reads approved; owner CRUD own; admin full
- **favorites**: User manages own (user_id = auth.uid())
- **meeting_requests**: Admin full; requester insert + read/delete own; seller reads approved for own listings
- **Storage**: Bucket for listing images; path `users/{user_id}/...`; RLS on insert/update for owner

---

## 6. Core Features

| Feature | Route / Location | Logic |
|---------|------------------|-------|
| Home | `/` | Featured items, search bar, popular filters |
| Browse | `/listings` or `/cars` | Filters (make, province, price, type), sort, pagination |
| Detail | `/listings/[id]` | Images, description, contact CTA, meeting request form |
| Favorites | `/favorites` | Sync server + guest (localStorage) |
| Compare | `/compare` | Up to 4 items, URL params + localStorage |
| Meeting request | Listing detail form | Insert into meeting_requests, admin approves |
| Unlock contact | Optional `/api/unlock` | Payment / email capture (can be stub) |
| Search analytics | Admin | Log keywords, make, province; stats by day/week/month |
| Page views | Optional | car_views table for listing stats |

---

## 7. API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/rdv` | GET | Fetch all meeting requests (service role) |
| `/api/favorites` | GET | List user's favorite IDs |
| `/api/favorites/bulk` | POST | Sync guest favorites to server |
| `/api/verify-turnstile` | POST | Cloudflare Turnstile (optional) |
| `/api/notify-discount` | POST | Notify on price drop (optional) |
| `/api/checkout` | POST | Payment / unlock (optional) |
| `/api/unlock` | POST | Contact unlock (often stub) |
| `/api/analytics/search` | POST | Log search (optional) |

---

## 8. Lib Modules

| File | Purpose |
|------|---------|
| `supabase.ts` | Browser client (createBrowserClient) |
| `supabase-server.ts` | Server client (createServerClient, cookies) |
| `supabase-admin.ts` | Service-role client (bypass RLS) |
| `constants.ts` | SITE_URL, currencies, enums (makes, types, etc.) |
| `format-utils.ts` | formatPrice, getRentalTiers, etc. |
| `date-utils.ts` | formatListedDate, etc. |
| `translations.ts` | i18n strings (fr/en) |
| `guest-favorites.ts` | localStorage for unauthenticated favorites |
| `image-utils.ts` | Image processing / validation |
| `phone-validation.ts` | Phone format validation |

---

## 9. Key Components

| Component | Purpose |
|-----------|---------|
| ClientLayout | Nav, footer, CookieNotice, ToastProvider |
| AuthNav | Login / Signup / Dashboard links |
| FavoriteButton | Toggle favorite, guest/server sync |
| ImageUpload | Multi-image upload to Supabase Storage |
| CarImageGallery | Listing detail image gallery |
| OptimizedCarImage | Next/Image wrapper, blur placeholder |
| VerifiedSellerBadge | Trust badge on listings |
| ShareButtons | Social share |
| TurnstileWidget | Cloudflare CAPTCHA (optional) |
| FadeInSection | Scroll animation |

---

## 10. Storage

- **Bucket**: `car-images` (or `listing-images`)
- **Path**: `users/{user_id}/{filename}`
- **RLS**: Insert/update only for `auth.jwt()->>'sub'` = folder user_id; select public for read

---

## 11. Middleware

- Uses Supabase SSR client to refresh session on each request
- Ensures API routes receive valid auth cookies
- Matcher excludes static assets

---

## 12. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=    # Required for admin API
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPPORT_EMAIL=
NEXT_PUBLIC_CDF_PER_USD=      # Optional: currency rate
```

---

## 13. Critical Setup Notes

### Profiles must exist

`meeting_requests.requester_id` (or `buyer_id`) FK → **profiles**, not auth.users. Run profiles backfill:

```sql
INSERT INTO profiles (id, full_name)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email)
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;
```

### Admin user

```sql
UPDATE profiles SET role = 'admin' WHERE id IN (SELECT id FROM auth.users WHERE email = 'admin@example.com');
```

### Migrations

Run in order (see `PUBLICATION_GUIDE.md` or your migration list). Core sequence:
1. Base schema (listings, profiles, favorites)
2. RLS policies
3. Meeting/request tables
4. Admin helpers, storage policies
5. Analytics, page views, search logs (optional)

---

## 14. Naming Mapping (Car → Generic)

| Car project | Generic / Housing / Jobs |
|-------------|--------------------------|
| cars | listings, properties, jobs |
| car_id | listing_id, property_id |
| rendezvous_requests | meeting_requests, inquiry_requests |
| buyer_id | requester_id |
| owner_id | seller_id (or keep owner_id) |
| make, model, mileage | beds, baths, sqft / title, company |
| car-images | listing-images |
| /cars | /listings, /properties, /jobs |
| CAR_MAKES | PROPERTY_TYPES, JOB_CATEGORIES |

---

## 15. Adaptation Checklist

| Step | Action |
|------|--------|
| 1 | Copy project structure; rename app/cars → app/listings (or your entity) |
| 2 | Define `listings` schema for your domain |
| 3 | Update constants (makes → property types, job categories, etc.) |
| 4 | Update RLS policies for new table names |
| 5 | Replace `meeting_requests` schema if different; ensure requester_id → profiles |
| 6 | Adapt search/filter logic (make → beds, province → city, etc.) |
| 7 | Update dashboard labels (Listings, Sellers, Meeting requests) |
| 8 | Update translations |
| 9 | Storage bucket name and RLS |
| 10 | Run migrations, backfill profiles, set admin |

---

## 16. Feature Matrix (Optional vs Core)

| Feature | Core | Optional |
|---------|------|----------|
| Auth (login/signup) | ✓ | |
| Listings CRUD | ✓ | |
| Browse + filters | ✓ | |
| Favorites | ✓ | |
| Meeting / inquiry requests | ✓ | |
| Admin approval flow | ✓ | |
| Compare | | ✓ |
| Rental listings | | ✓ |
| Page views | | ✓ |
| Search analytics | | ✓ |
| Admin messages | | ✓ |
| Turnstile / CAPTCHA | | ✓ |
| Unlock / payment | | ✓ |
| Verification badges | | ✓ |

---

## 17. Related Docs

- `TEMPLATE-MEETING-REQUESTS-REUSABLE.md` — Meeting/inquiry flow in detail
- `RDV-DIAGNOSTIC.md` — Troubleshooting meeting requests
- `PUBLICATION_GUIDE.md` — Deployment checklist (car-specific)
- `RDV-SETUP.md` — RDV setup steps (car-specific)
