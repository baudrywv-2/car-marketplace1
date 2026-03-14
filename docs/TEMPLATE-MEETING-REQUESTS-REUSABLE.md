# Reusable Template: Meeting / Inquiry Requests for Listings

Use this template for any marketplace (cars, housing, jobs, services). Adapt names and columns to your domain.

---

## 1. Core Flow

```
[Buyer/User] → Views listing → Requests meeting/inquiry → [Admin] approves → [Seller] sees approved contact
```

- **Buyer** submits a request (message, preferred date, optional offer)
- **Admin** sees all requests, approves or deletes
- **Seller** sees only approved requests for their listings

---

## 2. Database Schema (Generic)

### Tables

| Table | Purpose |
|-------|---------|
| `auth.users` | Supabase Auth (built-in) |
| `profiles` | User profile (id = auth.users.id, full_name, phone, etc.) |
| `listings` | Your main entity (cars, homes, jobs). Has `owner_id` → profiles |
| `meeting_requests` | Meeting/inquiry requests. Replaces `rendezvous_requests` |

### meeting_requests table

```sql
CREATE TABLE IF NOT EXISTS meeting_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,   -- FK to profiles, not auth.users
  requester_email text,
  requester_name text,
  requester_phone text,
  message text,
  preferred_date text,
  suggested_price numeric,        -- optional: buyer's offer
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS meeting_requests_listing_id_idx ON meeting_requests(listing_id);
CREATE INDEX IF NOT EXISTS meeting_requests_requester_id_idx ON meeting_requests(requester_id);
CREATE INDEX IF NOT EXISTS meeting_requests_status_idx ON meeting_requests(status);

ALTER TABLE meeting_requests ENABLE ROW LEVEL SECURITY;
```

**Important:** `requester_id` must reference `profiles(id)`, not `auth.users(id)`. Ensure every auth user has a profile row.

---

## 3. RLS Policies

### Helper (admin check)

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'); $$;
```

### Policies for meeting_requests

```sql
-- Admin: select all
CREATE POLICY "Admin select all" ON meeting_requests FOR SELECT TO authenticated
USING (public.is_admin());

-- Admin: update (approve)
CREATE POLICY "Admin update" ON meeting_requests FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admin: delete
CREATE POLICY "Admin delete" ON meeting_requests FOR DELETE TO authenticated
USING (public.is_admin());

-- Requester: insert (must be self)
CREATE POLICY "Authenticated insert" ON meeting_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = requester_id);

-- Seller: see approved for own listings only
CREATE POLICY "Seller sees approved for own listings" ON meeting_requests FOR SELECT TO authenticated
USING (
  status = 'approved'
  AND EXISTS (SELECT 1 FROM listings WHERE listings.id = meeting_requests.listing_id AND listings.owner_id = auth.uid())
);

-- Requester: see own
CREATE POLICY "Requester sees own" ON meeting_requests FOR SELECT TO authenticated
USING (requester_id = auth.uid());

-- Requester: delete own
CREATE POLICY "Requester delete own" ON meeting_requests FOR DELETE TO authenticated
USING (requester_id = auth.uid());
```

---

## 4. Profiles Backfill (CRITICAL)

If users exist in `auth.users` but not in `profiles`, inserts will fail with FK violation (409).

```sql
INSERT INTO profiles (id, full_name)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email)
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;
```

Run this whenever users may have been created without a profile (e.g. migration, manual import).

---

## 5. Admin API Route (Server-side, Service Role)

Fetch all requests bypassing RLS. Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

**Pattern:**
1. Use regular Supabase client (cookies) to get current user.
2. Check `profiles.role = 'admin'`.
3. Use service-role client to query `meeting_requests`.
4. Return JSON.

```ts
// GET /api/admin/meeting-requests
export async function GET() {
  const supabase = await createClient();  // from cookies
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();  // service role
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await admin
    .from("meeting_requests")
    .select(`
      id, listing_id, message, preferred_date, suggested_price, status, created_at,
      requester_email, requester_name, requester_phone, requester_id,
      listings(title, owner_id, owner_phone, owner_address)
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
```

---

## 6. Insert (Client-side, Listing Page)

```ts
const { error } = await supabase.from("meeting_requests").insert({
  listing_id: listingId,
  requester_id: user.id,
  requester_email: user.email ?? null,
  requester_name: profile?.full_name ?? user.email ?? null,
  requester_phone: profile?.phone ?? null,
  message: message.trim() || null,
  preferred_date: preferredDate || null,
  suggested_price: suggestedPrice || null,
  status: "pending",
});
```

---

## 7. Frontend Tabs / Pages

| Role | Location | Behavior |
|------|----------|----------|
| Requester | `/dashboard/requester` or "My requests" tab | List own requests, cancel |
| Seller | `/dashboard/seller` | List approved requests for own listings |
| Admin | `/dashboard/admin` → "Requests" tab | List all, approve, delete |

---

## 8. Adaptation Checklist for New Project

| Step | Action |
|------|--------|
| 1 | Rename `meeting_requests` → your name (e.g. `inquiry_requests`, `viewing_requests`) |
| 2 | Rename `listing_id` → `property_id`, `car_id`, `job_id`, etc. |
| 3 | Rename `listings` → `properties`, `cars`, `jobs`, etc. |
| 4 | Add/remove columns (e.g. `bedrooms`, `visit_slot`) |
| 5 | Update FK and RLS policies to use new table/column names |
| 6 | Ensure `requester_id` references `profiles(id)` |
| 7 | Run profiles backfill if migrating users |
| 8 | Add `SUPABASE_SERVICE_ROLE_KEY` for admin API |
| 9 | Create API route, listing form, and dashboard tabs |

---

## 9. Naming Mapping (Car ↔ Generic)

| Car project | Generic template |
|-------------|------------------|
| `rendezvous_requests` | `meeting_requests` |
| `car_id` | `listing_id` |
| `buyer_id` | `requester_id` |
| `cars` | `listings` |
| `buyer_*` | `requester_*` |

---

## 10. Quick Diagnostic

If requests don't appear for admin:

1. `SELECT COUNT(*) FROM meeting_requests` — 0 means insert failing
2. Check `requester_id` FK: must exist in `profiles`
3. Run profiles backfill
4. Check `SUPABASE_SERVICE_ROLE_KEY` for admin API
5. Verify admin user has `profiles.role = 'admin'`
