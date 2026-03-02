-- Allow authenticated users to search/view other profiles by basic identifiers.
-- This is required for features like:
--   1. "Link Existing" in family tree (search by Vanshmala ID)
--   2. "Transfer Money" in Wallet (find recipient by Vanshmala ID or phone)
--
-- Previously, the SELECT policy only allowed users to see their own profile,
-- causing "No profiles found" and "Recipient not found" errors even when the
-- target user exists in the database.

-- Drop any previous restrictive "own row only" policy on profiles if it exists
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can search all profiles" ON public.profiles;

-- Add a policy: any authenticated user can READ any profile row.
-- Users can still only UPDATE/INSERT their own profile (existing policies remain).
CREATE POLICY "Authenticated users can search all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Keep the self-only UPDATE policy (do not touch it — this only affects SELECT).
