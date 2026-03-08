-- Re-enable RLS on profiles without recursion.
-- Safe because admin checks use public.is_admin() (SECURITY DEFINER), which
-- reads profiles with definer rights and does not re-apply RLS.
-- Do NOT use inline (SELECT role FROM profiles WHERE id = auth.uid()) in
-- policies on profiles — that causes recursion.

-- 1. Ensure is_admin() exists and is SECURITY DEFINER (definer bypasses RLS when reading profiles)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- 2. Enable RLS (and force so table owner cannot bypass)
ALTER TABLE public.profiles
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles
  FORCE ROW LEVEL SECURITY;

-- 3. Drop known policies to avoid duplicates (ignore if missing)
DROP POLICY IF EXISTS "Users can select own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: authenticated select own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: authenticated update" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can select all profiles" ON public.profiles;

-- 4. SELECT: user sees own row; admins see all (via SECURITY DEFINER, no recursion)
CREATE POLICY "Profiles: select own or admin"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id = (SELECT auth.uid())
  OR (SELECT public.is_admin())
);

-- 5. INSERT: only own row (e.g. on signup trigger or self-registration)
CREATE POLICY "Profiles: insert own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = (SELECT auth.uid()));

-- 6. UPDATE: user updates own row; admins can update any (for verification badges, etc.)
CREATE POLICY "Profiles: update own or admin"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  id = (SELECT auth.uid())
  OR (SELECT public.is_admin())
)
WITH CHECK (
  id = (SELECT auth.uid())
  OR (SELECT public.is_admin())
);

COMMENT ON TABLE public.profiles IS 'RLS enabled. Admin checks use is_admin() SECURITY DEFINER to avoid recursion.';
