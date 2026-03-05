# DRCCARS Code Review

**Date:** March 1, 2025  
**Scope:** Full codebase review — fixes, deduplication, and efficiency suggestions without changing design or main functionality.

---

## 1. Duplications to Consolidate

### 1.1 `formatPrice` — 5 copies

**Current:** Same function defined in:
- `app/cars/page.tsx`
- `app/cars/[id]/page.tsx`
- `app/favorites/page.tsx`
- `app/compare/page.tsx`
- `app/page.tsx`

**Recommendation:** Add `lib/format-utils.ts`:

```ts
import { CDF_PER_USD } from "./constants";

export function formatPrice(price: number, currency: "USD" | "CDF", carCurrency: string | null | undefined): string {
  let amount = price;
  if (currency === "CDF" && carCurrency === "USD") amount = price * CDF_PER_USD;
  if (currency === "USD" && carCurrency === "CDF") amount = price / CDF_PER_USD;
  if (currency === "CDF") return `${Math.round(amount).toLocaleString()} FC`;
  return `$${amount.toLocaleString()}`;
}
```

Then replace all local definitions with:
`import { formatPrice } from "@/lib/format-utils"`.

---

### 1.2 `readGuestFavorites` — 4 copies

**Current:** Defined in:
- `app/cars/page.tsx`
- `app/cars/[id]/page.tsx`
- `app/favorites/page.tsx`
- `app/components/FavoriteButton.tsx` (uses `GUEST_KEY`)

**Recommendation:** Add to `lib/guest-favorites.ts`:

```ts
const GUEST_KEY = "guest-favorites";

export function readGuestFavorites(): string[] {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => typeof x === "string");
  } catch {
    return [];
  }
}

export function writeGuestFavorites(ids: string[]): void {
  try {
    const unique = Array.from(new Set(ids));
    localStorage.setItem(GUEST_KEY, JSON.stringify(unique));
  } catch {
    /* ignore */
  }
}

export const GUEST_FAVORITES_KEY = GUEST_KEY;
```

Update `FavoriteButton.tsx` and the three pages to import from this module.

---

### 1.3 `CAR_TYPES` — 2 copies

**Current:** Identical array in:
- `app/dashboard/cars/new/page.tsx`
- `app/dashboard/cars/[id]/edit/page.tsx`

**Recommendation:** Add to `lib/constants.ts`:

```ts
export const CAR_TYPES = [
  "Sedan", "SUV", "Hatchback", "Van", "Truck", "Pick up", "Wagon", "Coupe",
  "Mini Van", "Mini Bus", "Bus", "Convertible", "Machinery", "Other",
];
```

---

### 1.4 `siteUrl` / `NEXT_PUBLIC_SITE_URL` — 5 copies

**Current:** Same logic in:
- `app/sitemap.ts`
- `app/robots.ts`
- `app/layout.tsx`
- `app/components/CarProductJsonLd.tsx`
- `app/components/JsonLd.tsx`

**Recommendation:** Add to `lib/constants.ts`:

```ts
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://drccars.com";
```

Then import `SITE_URL` where needed.

---

### 1.5 Car card rendering — New Arrivals vs Browse All

**Current:** In `app/cars/page.tsx`, the New Arrivals grid (lines ~730–771) and Browse All grid (lines ~862–928) share almost the same card JSX, with slight layout differences (compare checkbox only in Browse All).

**Recommendation:** Extract a shared `<CarCard />` component that accepts props for density, showCompare, favoriteIds, compareIds, toggleCompare, etc. This reduces ~60 lines of repeated JSX and keeps styling consistent.

---

## 2. Unused Code / Dead Files

### 2.1 `lib/drc-provinces.ts` — Unused

**Current:** `DRC_PROVINCES` (26 provinces) is defined but never imported or used. The app uses `DRC_LOCATIONS` (main cities) from `lib/constants.ts` for Town/City.

**Recommendation:** Either:
- **Option A:** Delete `lib/drc-provinces.ts` if you do not plan to use provinces.
- **Option B:** Keep if you intend to support province-level filtering later; document as “reserved for future use.”

---

## 3. Bugs & Edge Cases to Fix

### 3.1 Edit car page — Login redirect loses destination

**Current:** `app/dashboard/cars/[id]/edit/page.tsx` redirects unauthenticated users with:

```ts
router.replace("/login");
```

**Issue:** User is not sent back to the edit page after login.

**Fix:**

```ts
router.replace(`/login?next=${encodeURIComponent(`/dashboard/cars/${id}/edit`)}`);
```

The login page already supports `?next=...`.

---

### 3.2 Admin/Dashboard login redirect — Same issue

**Current:** `app/dashboard/admin/page.tsx` uses `router.replace("/login")`.

**Fix:** Add `?next=/dashboard/admin` so users return to the admin page after login.

---

### 3.3 Login form — Hardcoded labels

**Current:** Labels in `app/login/page.tsx`:
- "Email"
- "Password"

**Issue:** Not using translations; breaks i18n consistency.

**Fix:** Add translation keys (e.g. `email`, `password`) and use `t("email")`, `t("password")`.

---

### 3.4 PRICE_RANGES — Currency handling

**Current:** `PRICE_RANGES` in `app/cars/page.tsx` uses USD values (e.g. `min: 1000`, `max: 5000`). Prices are filtered directly against `car.price`, but cars can be listed in CDF.

**Issue:** A car priced 2,000,000 CDF will not match “$1,000–$5,000” even if equivalent.

**Recommendation:** Either:
- Document that filters are USD-based and prices in CDF are treated as raw numbers (current behavior), or
- Normalize prices to USD before filtering when `car.currency === "CDF"` (divide by `CDF_PER_USD`).

---

### 3.5 Sitemap — Non-null assertions on env

**Current:** `app/sitemap.ts` checks `supabaseUrl` and `supabaseKey` and returns static pages if missing. No crash risk.

**Note:** Other files use `process.env.X!`; if env vars are missing, runtime errors can occur. Consider centralizing env validation or using defaults where safe.

---

## 4. Consistency Improvements

### 4.1 Compare page — Use `OptimizedCarImage`

**Current:** `app/compare/page.tsx` uses a raw `<img>` for car thumbnails:

```tsx
<img src={car.images[0]} alt={car.title} className="..." loading="lazy" />
```

**Recommendation:** Use `OptimizedCarImage` like the cars browse and favorites pages for consistent sizing and optimization.

---

### 4.2 Favorites API — `createClient` per handler

**Current:** `app/api/favorites/route.ts` calls `createClient()` at the start of each handler (GET, POST, DELETE). This is correct for serverless routes.

**Note:** No change needed; just documenting that the pattern is appropriate.

---

### 4.3 Car type definitions

**Current:** `Car` (or similar) is defined locally in multiple files with slight variations.

**Recommendation:** Add a shared `lib/types.ts` (or extend an existing types file) with a base `Car` type and use it where possible. This keeps schema changes in one place.

---

## 5. Minor Fixes

### 5.1 FavoriteButton — `variant` classes

**Current:** Both icon and button variants use `h-5 w-5` for the icon, but the conditional is redundant:

```tsx
className={variant === "icon" ? "h-5 w-5" : "h-5 w-5"}
```

**Fix:** Use `className="h-5 w-5"` directly.

---

### 5.2 `clearAllFilters` — Reset URL params

**Current:** `clearAllFilters` in `app/cars/page.tsx` clears state but does not update the URL. If the user arrived via `/cars?make=Toyota&province=Kinshasa`, the state is cleared but the URL still shows those params.

**Recommendation:** Use `router.replace("/cars")` or `router.replace` with cleared search params when clearing filters, so the URL matches the UI.

---

## 6. Summary of Priority

| Priority | Item | Effort |
|----------|------|--------|
| High | Extract `formatPrice` to `lib/format-utils.ts` | Low |
| High | Extract `readGuestFavorites` to `lib/guest-favorites.ts` | Low |
| High | Edit/Admin login redirect with `?next=` | Low |
| Medium | Extract `CAR_TYPES` to constants | Trivial |
| Medium | Extract `SITE_URL` to constants | Trivial |
| Medium | Add `email`/`password` translations for login | Low |
| Medium | Extract shared `CarCard` on cars page | Medium |
| Low | Remove or document `drc-provinces.ts` | Trivial |
| Low | Compare page: use `OptimizedCarImage` | Low |
| Low | FavoriteButton icon class cleanup | Trivial |
| Low | `clearAllFilters` URL sync | Low |
| Consider | Shared `Car` type in `lib/types.ts` | Medium |
| Consider | PRICE_RANGES currency handling | Medium |

---

## 7. Design Preserved

No changes were suggested that alter:

- Page layouts or visual design
- Feature behavior (favorites, compare, filters, dashboard, admin, etc.)
- Supabase schema or RLS
- Stripe/checkout flow
- Locale/currency switching

---

*End of review*
