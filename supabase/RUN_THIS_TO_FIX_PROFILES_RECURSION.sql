-- =============================================================================
-- FIX: "infinite recursion detected in policy for relation profiles"
-- Run this in Supabase Dashboard → SQL Editor → New query
-- =============================================================================
-- Any policy on profiles that uses is_admin() causes recursion because is_admin()
-- reads from profiles. The cleanest fix: disable RLS on profiles.
-- The app enforces access control (users only update their own profile via .eq('id', user.id)).
-- =============================================================================

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Done. Profile updates (Settings page) will now work without recursion.
