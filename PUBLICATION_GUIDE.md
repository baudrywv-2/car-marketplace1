# DRCCARS – Publication Checklist

Specific tasks you will do, in order.

---

## Phase 1: Supabase

### Task 1.1 – Create Supabase project (if new)

1. Open https://supabase.com and sign in.
2. Click **New project**.
3. Name: `drccars-prod` (or your choice).
4. Database password: choose a strong password and store it.
5. Region: select one near your users (e.g. Frankfurt).
6. Click **Create new project**.
7. Wait until the project status shows “Active”.

---

### Task 1.2 – Run migrations in Supabase SQL Editor

1. Supabase Dashboard → left sidebar → **SQL Editor**.
2. Click **New query**.
3. For each file below: open it from your project, copy the full contents, paste into the SQL Editor, click **Run**, then move to the next file.
4. Run them in this exact order:

| # | File path |
|---|-----------|
| 1 | `supabase/migrations/001_cars_and_favorites.sql` |
| 2 | `supabase/fix-admin-dashboard.sql` |
| 3 | `supabase/dashboards-and-rdv-schema.sql` |
| 4 | `supabase/migrations/add_profile_contact.sql` |
| 5 | `supabase/migrations/add_admin_messages_and_notifications.sql` |
| 6 | `supabase/migrations/add_rdv_suggested_price.sql` |
| 7 | `supabase/migrations/add_delete_rdv_and_admin_messages.sql` |
| 8 | `supabase/add_rejection_reason.sql` |
| 9 | `supabase/migrations/add_condition_and_storage.sql` |
| 10 | `supabase/migrations/add_cars_columns.sql` |
| 11 | `supabase/migrations/add_is_sold.sql` |
| 12 | `supabase/migrations/allow_sold_cars_visible.sql` |
| 13 | `supabase/migrations/add_listing_boost_ranking.sql` |
| 14 | `supabase/migrations/add_admin_delete_cars.sql` |
| 15 | `supabase/migrations/add_rental_listing.sql` |
| 16 | `supabase/migrations/add_rental_weekly_monthly.sql` |
| 17 | `supabase/migrations/add_car_features.sql` |
| 18 | `supabase/add-verification-badges.sql` |
| 19 | `supabase/migrations/add_search_logs.sql` |
| 20 | `supabase/migrations/add_user_registration_stats.sql` |
| 21 | `supabase/migrations/add_page_views.sql` |
| 22 | `supabase/fix-favorites-rls.sql` |
| 23 | `supabase/fix-storage-rls-complete.sql` (or `fix-storage-rls.sql` if storage fails) |
| 24 | `supabase/migrations/fix_cars_rls_lint.sql` |
| 25 | `supabase/migrations/fix_admin_messages_select_consolidate.sql` |
| 26 | `supabase/migrations/fix_cars_update_duplicate_policy.sql` |
| 27 | `supabase/migrations/fix_admin_messages_rls_lint.sql` |

5. If a file is missing in your project, skip it.
6. Ignore “already exists” or “does not exist” errors; continue with the next file.

---

### Task 1.3 – Create your first user and set as admin

1. Open your app (locally or deployed) and sign up with your email.
2. Supabase Dashboard → **SQL Editor** → **New query**.
3. Paste and run (replace with your email):

```sql
UPDATE profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'YOUR-EMAIL-HERE@example.com'
);
```

4. Confirm: **Authentication** → **Users** → your user exists.

---

### Task 1.4 – Copy Supabase credentials

1. Supabase Dashboard → **Project Settings** (gear) → **API**.
2. Copy **Project URL** (e.g. `https://abcdefgh.supabase.co`) → save as `NEXT_PUBLIC_SUPABASE_URL`.
3. Copy **anon** key (under “Project API keys”) → save as `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## Phase 2: Turnstile (optional)

### Task 2.1 – Get Turnstile keys

1. Open https://dash.cloudflare.com → sign in.
2. **Turnstile** in the left sidebar.
3. Click **Add site**.
4. Site name: `drccars`.
5. Choose **Managed** or **Non-interactive**.
6. Domain: your production domain or `localhost` for dev.
7. Click **Create**.
8. Copy **Site Key** → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
9. Copy **Secret Key** → `TURNSTILE_SECRET_KEY`.

If you skip this, the app works without Turnstile.

---

## Phase 3: Environment variables

### Task 3.1 – Local `.env.local`

1. In project root, create (or edit) `.env.local`.
2. Add:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

3. Replace with your real values.
4. Optionally add Turnstile keys from Task 2.1.

---

### Task 3.2 – Vercel environment variables

1. Go to https://vercel.com and sign in.
2. Open your project (or do Phase 4 first, then come back).
3. **Settings** → **Environment Variables**.
4. Add each variable:
   - `NEXT_PUBLIC_SUPABASE_URL` – Project URL from Task 1.4
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` – anon key from Task 1.4
   - `NEXT_PUBLIC_SITE_URL` – your production URL (e.g. `https://drccars.com`)
5. Choose **Production** (and Preview if you want).
6. Click **Save**.
7. Add Turnstile keys if you use them (Task 2.1).

---

## Phase 4: Vercel deployment

### Task 4.1 – Import project

1. Go to https://vercel.com.
2. **Add New** → **Project**.
3. **Import** your `car-marketplace` Git repository.
4. **Framework Preset:** Next.js (default).
5. **Root Directory:** leave blank.
6. **Build and Output Settings:** leave defaults.
7. Expand **Environment Variables**.
8. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same values as Task 3.2).
9. Click **Deploy**.
10. Wait for the build to finish.

---

### Task 4.2 – Set production URL

1. In Vercel: your project → **Settings** → **Domains**.
2. Add your domain (e.g. `drccars.com` or `www.drccars.com`).
3. Add the DNS records Vercel shows at your domain registrar (A, CNAME, etc.).
4. Wait for SSL to become active (usually a few minutes).

---

### Task 4.3 – Configure Supabase redirect URLs

1. Supabase Dashboard → **Authentication** → **URL Configuration**.
2. **Site URL:** set to your production URL (e.g. `https://drccars.com`).
3. **Redirect URLs:** add these (one per line):
   - `https://drccars.com/**`
   - `https://drccars.com`
   - `https://www.drccars.com/**`
   - `http://localhost:3000/**`
4. Replace `drccars.com` with your actual domain.
5. Click **Save**.

---

## Phase 5: Verification

Do these checks after deployment:

- [ ] **Task 5.1** – Open `https://your-domain.com` → homepage loads.
- [ ] **Task 5.2** – Go to `/cars` → browse page loads.
- [ ] **Task 5.3** – Sign up with a new email → account created.
- [ ] **Task 5.4** – Log in with your admin email → you see the dashboard.
- [ ] **Task 5.5** – As admin, open `/dashboard/admin` → Listings, Users, Traffic, RDV, Messages tabs load.
- [ ] **Task 5.6** – As a seller, create a listing with an image → upload succeeds.
- [ ] **Task 5.7** – As admin, approve the listing → it shows on `/cars`.
- [ ] **Task 5.8** – As a buyer, request a meeting (rendez-vous) on a car → request appears in admin RDV tab.

---

## Summary: Required variables

| Variable | Where to get it | Where to set it |
|----------|-----------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | `.env.local` + Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon | `.env.local` + Vercel |
| `NEXT_PUBLIC_SITE_URL` | Your production domain | `.env.local` + Vercel |
