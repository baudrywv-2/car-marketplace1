# RDV Diagnostic: Admin Not Seeing Buyer Submissions

When buyers submit rendez-vous requests but admins don't see them, check these points in order.

---

## 1. Confirm Data Is in the Database

**Run in Supabase Dashboard → SQL Editor:**

```sql
-- Count all RDV
SELECT COUNT(*) FROM rendezvous_requests;

-- Show recent RDV with key fields
SELECT id, car_id, buyer_email, buyer_name, status, created_at
FROM rendezvous_requests
ORDER BY created_at DESC
LIMIT 20;
```

- **If you get 0 rows:** The insert is failing or data goes elsewhere. Proceed to §2.
- **If you get rows:** Data exists; the problem is between the API and the admin UI. Proceed to §4.

---

## 2. Buyer Insert Path

If the DB has no rows, the buyer insert is failing.

**Possible causes:**

| Cause | Check |
|-------|-------|
| RLS blocks insert | Confirm migration `ensure_rdv_complete.sql` (or equivalent) ran. Policy "Rdv: authenticated insert" must allow `auth.uid() = buyer_id`. |
| Missing/bad FK | `car_id` must reference `cars.id`, `buyer_id` must reference `auth.users.id`. Invalid IDs cause insert to fail. |
| Table/schema missing | Run `ensure_rdv_complete.sql` in Supabase SQL Editor. |

**To verify RLS policies:**

```sql
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'rendezvous_requests';
```

**To test insert manually (replace UUIDs):**

```sql
-- Use a real car_id and buyer_id (auth.users)
INSERT INTO rendezvous_requests (car_id, buyer_id, buyer_email, message, preferred_date, status)
VALUES (
  'your-car-uuid'::uuid,
  'your-buyer-user-uuid'::uuid,
  'buyer@example.com',
  'Test',
  '2025-03-15',
  'pending'
);
```

---

## 3. Service Role Key

The admin API uses `createAdminClient()` which requires `SUPABASE_SERVICE_ROLE_KEY`.

**Check `.env.local`:**

```
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Must be present
```

- **If missing:** API route throws → response is 500 with `"SUPABASE_SERVICE_ROLE_KEY required for admin..."` or generic internal error.
- Restart the dev server after adding/updating env vars.

---

## 4. Admin Role and Auth

The API returns 403 if the user is not an admin.

**Verify your admin user:**

```sql
-- Replace with your email
SELECT p.id, p.role, u.email
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'your-admin@email.com';
```

`role` must be exactly `'admin'` (case-sensitive).

**Check auth in API route:**

- API uses `createClient()` from `supabase-server` (reads cookies).
- If you are not logged in → 401 Unauthorized.
- If your profile `role` ≠ `'admin'` → 403 Forbidden.

---

## 5. API Response (Network Tab)

1. Open DevTools → **Network**.
2. Log in as admin and go to Admin Dashboard.
3. Filter for `rdv` and inspect the request to `/api/admin/rdv`.

| Status | Meaning |
|--------|---------|
| **401** | Not logged in or session expired. Check cookies and middleware. |
| **403** | User not admin. Check profile role. |
| **500** | Server error. Often service role key missing or DB error. See response body. |
| **200 + empty array `[]`** | API runs OK but query returns no rows. If DB has rows, possible schema/env mismatch. |
| **200 + array with data** | API works; issue is in admin UI (tab, state, or display logic). |

---

## 6. Response Handling in Admin UI

Admin page uses:

```ts
const json = await res.json().catch(() => ({}));
if (res.ok && Array.isArray(json)) {
  rdvList = json as RdvRequest[];
} else {
  const errMsg = (json as { error?: string }).error || `HTTP ${res.status}`;
  setRdvFetchError(errMsg);
}
```

- On error, `rdvFetchError` should show (e.g. amber banner in RDV tab).
- If the UI shows no data and no error, the API likely returned `200` with `[]`.

---

## 7. Supabase URL / Project Mismatch

If you have multiple projects:

- Buyer insert uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Admin API uses `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

Both must target the **same** Supabase project where `rendezvous_requests` lives.

---

## 8. Checklist Summary

| # | Check | How |
|---|-------|-----|
| 1 | Data in DB | Run `SELECT COUNT(*) FROM rendezvous_requests` in Supabase SQL |
| 2 | RLS on insert | Ensure `ensure_rdv_complete.sql` ran |
| 3 | Service role key | `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` |
| 4 | Admin role | `SELECT role FROM profiles WHERE id = 'your-id'` → `admin` |
| 5 | API status | Network tab: `/api/admin/rdv` status + body |
| 6 | Same Supabase project | Confirm env vars match the project where RDV are stored |

---

## 9. One-Shot Diagnostic SQL

Run in Supabase SQL Editor:

```sql
-- RDV count
SELECT 'rdv_count' AS check_name, COUNT(*)::text AS result FROM rendezvous_requests
UNION ALL
-- Sample RDV
SELECT 'sample_rdv', COALESCE(
  (SELECT json_agg(json_build_object('id', id, 'buyer_email', buyer_email, 'status', status, 'created_at', created_at))
   FROM (SELECT id, buyer_email, status, created_at FROM rendezvous_requests ORDER BY created_at DESC LIMIT 3) t),
  '[]'
)::text
UNION ALL
-- is_admin function exists
SELECT 'is_admin_exists', CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN 'yes' ELSE 'no' END
UNION ALL
-- Admin policies on rendezvous_requests
SELECT 'rdv_admin_policy', CASE
  WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rendezvous_requests' AND policyname LIKE '%admin%') THEN 'yes'
  ELSE 'no'
END;
```

If `rdv_count` is 0 and buyers report successful submit, the insert path (RLS / client) is the issue. If `rdv_count` > 0 but admin sees nothing, focus on the API key, admin role, and API response.
