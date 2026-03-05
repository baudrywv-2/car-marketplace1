# Tasks only you can do

---

## Rental listings (NEW)

To enable rental cars (events, tourism, hourly/daily/weekly/monthly):

1. In **Supabase → SQL Editor**, run `supabase/migrations/add_rental_listing.sql`
2. Run `supabase/migrations/add_rental_weekly_monthly.sql` for weekly and monthly pricing tiers
3. Run `supabase/migrations/add_is_sold.sql` so sellers can mark cars as sold
4. Run `supabase/migrations/add_admin_delete_cars.sql` so admins can delete listings
5. Sellers can choose "For sale", "For rent", or "Sale & rent" when adding/editing a car
6. Rent page: `/rent` — event categories (Weddings, Tourism, Corporate, Airport, Private)
7. Browse cars: filter by listing type; rent page has its own event tabs
8. Sellers can **Mark as sold** from the dashboard; sold cars are hidden from public browse

---

These are the **only** steps that need your action. The rest of the app is already implemented.

---

## 1a. Fix schema + image upload (run first if you get errors)

If you see **"Could not find the 'condition' column"** or **"row-level security policy on image upload"** when listing a car:

1. Go to **Supabase → SQL Editor**
2. Run the SQL in `supabase/fix-schema-and-storage.sql` (for condition/currency columns)
3. In **Supabase → Storage**, create bucket `car-images` (Public: Yes) if it doesn't exist
4. For **"new row violates row-level security policy"** on image upload: run the SQL in **`supabase/fix-storage-upload-rls.sql`** (removes conflicting policies and applies permissive RLS that works reliably)

---

## 1b. Email verification (required to list cars)

Only **verified** users can add car listings. Verification = email confirmed.

1. In **Supabase → Authentication → Providers → Email**, enable **"Confirm email"**.
2. New users will receive a confirmation link by email. After they click it, they can list cars.
3. Existing users who haven’t confirmed can use "Resend verification email" on the Add car page.

---

## 1c. Phone number + CAPTCHA (reduce fake/spam accounts)

Signup now requires a **phone number** and optionally **Cloudflare Turnstile** CAPTCHA to reduce fake accounts and spam.

**Phone number:** Required at signup. Stored in user metadata. See optional SQL below to add `phone` to `profiles`.

**Cloudflare Turnstile (recommended):** Free CAPTCHA that blocks bots.
1. Go to [Cloudflare Dashboard → Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile), add a widget (Managed mode).
2. Add to `.env.local`:
```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAA...
TURNSTILE_SECRET_KEY=0x4AAAAAAA...
```
3. Restart the dev server. Without these env vars, signup works but CAPTCHA is skipped.

**Hero image:** The landing page uses a Mercedes image from Unsplash. For a specific Mercedes G-Class, add your own image to `/public/hero-gclass.jpg` and change the Image `src` in `app/page.tsx` to `/hero-gclass.jpg`, or replace the Unsplash URL.

**Profile contact (required for sellers):** Phone and WhatsApp are stored in `profiles` and used for all listings. Sellers set them once in Dashboard → Contact settings. Run the migration:
1. Go to **Supabase → SQL Editor**
2. Run the SQL in `supabase/migrations/add_profile_contact.sql`

This adds `phone` and `whatsapp` to profiles, backfills from signup metadata, and ensures new signups copy phone to their profile. Sellers must set contact before publishing listings.

---

## 1. Install new dependencies

In the project folder run:

```bash
npm install
```

(This installs `stripe` and `@supabase/ssr` that were added to the project.)

---

## 2. Stripe (for “Pay to see contact”)

1. Create an account at [stripe.com](https://stripe.com) if you don’t have one.
2. In Stripe Dashboard: **Developers → API keys**. Copy:
   - **Publishable key** (starts with `pk_`)
   - **Secret key** (starts with `sk_`)
3. In your project, open **`.env.local`** and add:

```env
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
UNLOCK_PRICE_CENTS=500
```

- Use your real **Secret** and **Publishable** keys.
- `UNLOCK_PRICE_CENTS=500` means $5.00. Change it if you want another price.

4. Restart the dev server after saving: `npm run dev`.

---

## 3. Supabase SQL (one-time)

In **Supabase → SQL Editor**, run **one** of the two blocks below.

**Option A – If you already added `buyer_email` and the “Rdv: admin can read all” policy**  
Run only this:

```sql
-- Let buyers read car contact fields after they've paid to unlock
create policy "Cars: buyer can read car if unlocked"
on cars for select
using (
  exists (
    select 1 from contact_unlocks cu
    where cu.car_id = cars.id and cu.buyer_id = auth.uid()
  )
);
```

**Option B – If you haven’t run any of the rendez-vous SQL yet**  
Run this full block:

```sql
alter table rendezvous_requests
  add column if not exists buyer_email text;

create policy "Rdv: admin can read all"
on rendezvous_requests for select
using (
  (select role from profiles where id = auth.uid()) = 'admin'
);

create policy "Cars: buyer can read car if unlocked"
on cars for select
using (
  exists (
    select 1 from contact_unlocks cu
    where cu.car_id = cars.id and cu.buyer_id = auth.uid()
  )
);
```

---

## 4. Add Province column (for Province + Town filters)

In **Supabase → SQL Editor**, run:

```sql
alter table cars
  add column if not exists province text;
```

---

## 5. Add Currency, Condition, Discount (BeForward-style)

In **Supabase → SQL Editor**, run:

```sql
alter table cars add column if not exists currency text default 'USD';
alter table cars add column if not exists condition text default 'used' check (condition in ('new', 'used'));
alter table cars add column if not exists discount_percent numeric(5,2);
```

After this:
- Sellers choose **USD** or **CDF** and **New** or **Used** when adding a car.
- Buyers see prices in their chosen currency (EN/FR and USD/CDF in the header).
- **Shop by Discount** on the browse page works when you set `discount_percent` on listings (e.g. 10, 20, 30).

---

## 5b. Add Transmission and Fuel type (automatic/manual, essence/diesel/electric/hybrid)

In **Supabase → SQL Editor**, run:

```sql
alter table cars add column if not exists transmission text check (transmission is null or transmission in ('automatic', 'manual'));
alter table cars add column if not exists fuel_type text check (fuel_type is null or fuel_type in ('essence', 'diesel', 'electric', 'hybrid'));
```

**If `fuel_type` already exists** with the old constraint, run this to add electric and hybrid:

```sql
alter table cars drop constraint if exists cars_fuel_type_check;
alter table cars add constraint cars_fuel_type_check check (fuel_type is null or fuel_type in ('essence', 'diesel', 'electric', 'hybrid'));
```

After this:
- Sellers can set **Automatic** or **Manual** and **Petrol (Essence)** or **Diesel** when adding/editing a car.
- **Transmission** and **Fuel** filters appear on the browse page.

---

## 5c. Favorites (buyers can save cars)

In **Supabase → SQL Editor**, run:

```sql
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  car_id uuid not null references cars(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, car_id)
);

create index if not exists favorites_user_id_idx on favorites(user_id);
create index if not exists favorites_car_id_idx on favorites(car_id);

alter table favorites enable row level security;

create policy "Users can manage own favorites"
on favorites for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

After this:
- Logged-in buyers can add/remove cars from **My Favorites** (heart on cards and car detail).
- A **My Favorites** link appears in the header when logged in; `/favorites` lists saved cars.

---

## 5d. Car views (analytics for sellers/admin)

In **Supabase → SQL Editor**, run:

```sql
create table if not exists car_views (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references cars(id) on delete cascade,
  viewer_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists car_views_car_id_idx on car_views(car_id);
create index if not exists car_views_viewer_id_idx on car_views(viewer_id);

alter table car_views enable row level security;

create policy "Anyone can insert car view"
on car_views for insert
with check (true);

create policy "Admins can read car views"
on car_views for select
using (
  (select role from profiles where id = auth.uid()) = 'admin'
);
```

After this:
- Every time someone opens a car detail page, a row is added to `car_views`.
- Sellers and admins can see view counts in the dashboard once we join this data.

---

## 6. Optional: CDF exchange rate

To show prices in CDF, the app uses a fixed rate (default 2750 CDF = 1 USD). To override, add to `.env.local`:

```env
NEXT_PUBLIC_CDF_PER_USD=2800
```

---

## 7. Test when ready

- **Browse cars:** filters (make, type, province, town/city, min/max price), open a listing.
- **Pay to see contact:** log in as buyer → open a car → “Pay to see contact ($5)” → pay with Stripe test card `4242 4242 4242 4242` → you should see the success page and seller contact; on the car page you should see the contact box.
- **Request rendez-vous:** log in → open a car → “Request rendez-vous” → send; as admin, open “Manage listings (admin)” → “Rendez-vous requests” tab.
- **Login redirect:** open a car → “Log in to request rendez-vous” → after login you should land back on that car page.

---

You don’t need to test after every small change. Run the steps above when you’re ready, then do a full test pass.
