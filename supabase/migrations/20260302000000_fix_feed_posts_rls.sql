-- Fix feed_posts RLS policies.
--
-- The feed_posts.user_id column references profiles.id (the profile PK),
-- NOT auth.users.id (the auth UUID). The original INSERT/UPDATE/DELETE
-- policies used `auth.uid() = user_id` which always fails because auth.uid()
-- returns the auth UUID, not the profile UUID.
--
-- Fix: compare against the profile row whose user_id = auth.uid().

-- Drop old broken policies
DROP POLICY IF EXISTS "Users can create their own posts" ON public.feed_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.feed_posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.feed_posts;
DROP POLICY IF EXISTS "Everyone can view posts" ON public.feed_posts;

-- Re-create SELECT: any authenticated user can read all posts
CREATE POLICY "Everyone can view posts"
ON public.feed_posts
FOR SELECT TO authenticated
USING (true);

-- Re-create INSERT: user_id must match the caller's profile row in profiles table
CREATE POLICY "Users can create their own posts"
ON public.feed_posts
FOR INSERT TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.profiles WHERE profiles.user_id = auth.uid()
  )
);

-- Re-create UPDATE: same check
CREATE POLICY "Users can update their own posts"
ON public.feed_posts
FOR UPDATE TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE profiles.user_id = auth.uid()
  )
);

-- Re-create DELETE: same check
CREATE POLICY "Users can delete their own posts"
ON public.feed_posts
FOR DELETE TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE profiles.user_id = auth.uid()
  )
);
