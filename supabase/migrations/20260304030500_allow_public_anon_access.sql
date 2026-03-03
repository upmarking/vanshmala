
-- 1. Redefine helper function to handle anonymous users
CREATE OR REPLACE FUNCTION public.check_feed_visibility(viewer_id UUID, author_id UUID, vis TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- If it's public, everyone can see it
  SELECT 
    vis = 'public'
    OR (
      viewer_id IS NOT NULL AND (
        viewer_id = author_id 
        OR (
          vis = '3rd_degree' AND (
            -- Same tree
            EXISTS (
              SELECT 1 FROM tree_memberships tm1
              JOIN tree_memberships tm2 ON tm1.tree_id = tm2.tree_id
              WHERE tm1.user_id = viewer_id AND tm2.user_id = author_id
            )
            -- Or Same Gotra (ignoring nulls)
            OR EXISTS (
              SELECT 1 FROM profiles p1
              JOIN profiles p2 ON p1.gotra = p2.gotra
              WHERE p1.user_id = viewer_id AND p2.user_id = author_id
              AND p1.gotra IS NOT NULL AND p1.gotra != ''
            )
          )
        )
        OR (
          vis = '2nd_degree' AND EXISTS (
              SELECT 1 FROM tree_memberships tm1
              JOIN tree_memberships tm2 ON tm1.tree_id = tm2.tree_id
              WHERE tm1.user_id = viewer_id AND tm2.user_id = author_id
          )
        )
        OR (
          vis = '1st_degree' AND EXISTS (
             WITH my_fms AS (
                SELECT id FROM family_members WHERE user_id = viewer_id
             ),
             author_fms AS (
                SELECT id FROM family_members WHERE user_id = author_id
             )
             SELECT 1
             FROM my_fms M, author_fms A
             WHERE 
             M.id = A.id
             OR EXISTS (
                SELECT 1 FROM family_relationships fr 
                WHERE (fr.from_member_id = M.id AND fr.to_member_id = A.id)
                   OR (fr.from_member_id = A.id AND fr.to_member_id = M.id)
             )
             OR EXISTS (
                SELECT 1 FROM family_relationships fr1
                JOIN family_relationships fr2 ON 
                   (fr1.to_member_id = fr2.from_member_id) OR
                   (fr1.from_member_id = fr2.from_member_id) OR
                   (fr1.from_member_id = fr2.to_member_id) OR
                   (fr1.to_member_id = fr2.to_member_id)
                WHERE 
                (fr1.from_member_id = M.id OR fr1.to_member_id = M.id)
                AND
                (fr2.from_member_id = A.id OR fr2.to_member_id = A.id)
             )
          )
        )
      )
    )
$$;

-- 2. Update Feed Posts policy to include anon role
DROP POLICY IF EXISTS "Users can view feed posts based on visibility" ON public.feed_posts;
CREATE POLICY "Everyone can view feed posts based on visibility" ON public.feed_posts
  FOR SELECT TO public USING (
    public.check_feed_visibility(
      auth.uid(), 
      (SELECT user_id FROM public.profiles WHERE id = feed_posts.user_id), 
      visibility
    )
  );

-- 3. Update Timeline Events policy to include anon role (using created_by which should be public.profiles.user_id)
DROP POLICY IF EXISTS "Timeline visible based on visibility restrictions" ON public.timeline_events;
CREATE POLICY "Timeline visible based on visibility restrictions" ON public.timeline_events
  FOR SELECT TO public USING (
    public.check_feed_visibility(auth.uid(), created_by, visibility)
    OR (created_by IS NULL AND auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.id = timeline_events.family_member_id
      AND public.is_tree_member(auth.uid(), fm.tree_id)
    ))
  );

-- 4. Allow anonymous users to view basic profile info (required for names/avatars on public posts)
DROP POLICY IF EXISTS "Authenticated users can search all profiles" ON public.profiles;
CREATE POLICY "Anyone can view basic profile info"
ON public.profiles
FOR SELECT
TO public
USING (true);
