# Rendez-vous (RDV) Setup

## 1. Run the migrations

In **Supabase Dashboard → SQL Editor**, run (in order):

1. `supabase/migrations/ensure_rdv_complete.sql`
2. `supabase/migrations/add_rdv_intent.sql` (adds rent/buy intent)

(Copy the file contents and paste, then Run.)

## 2. Add service role key

1. Supabase Dashboard → **Settings** → **API**
2. Copy the **service_role** key (under "Project API keys")
3. Add to `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_key_here
   ```
4. Restart the dev server

## 3. Make yourself admin

Run in SQL Editor (replace with your email):

```sql
UPDATE profiles SET role = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
```

## 4. Test

1. Log in as a buyer
2. Open a car listing → "Request meeting" → pick a date → Send
3. Log in as admin → Admin Dashboard → Rendez-vous tab
4. The request should appear
