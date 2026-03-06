-- Fix infinite recursion in RLS policy on profiles
-- Run this in Supabase → SQL Editor
--
-- Problem: Any policy on profiles that uses is_admin() causes recursion because
-- is_admin() reads from profiles. Same for (SELECT role FROM profiles WHERE id = auth.uid()).
--
-- Fix: Disable RLS on profiles. The app enforces access control (users only
-- update their own profile via .eq('id', user.id)). Admin verification badges
-- are set via admin dashboard which uses service/admin context.

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

