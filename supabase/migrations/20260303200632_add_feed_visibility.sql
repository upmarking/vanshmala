-- 1. Add visibility column to feed_posts
ALTER TABLE public.feed_posts 
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT '1st_degree'
CHECK (visibility IN ('1st_degree', '2nd_degree', '3rd_degree', 'public'));

-- 2. Add visibility column to timeline_events
ALTER TABLE public.timeline_events
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT '1st_degree'
CHECK (visibility IN ('1st_degree', '2nd_degree', '3rd_degree', 'public'));

-- 3. Create a helper function to check visibility
CREATE OR REPLACE FUNCTION public.check_feed_visibility(viewer_id UUID, author_id UUID, vis TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- If I'm the author, or it's public
  SELECT 
    viewer_id = author_id 
    OR vis = 'public'
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
         -- 2nd degree defined simply as: inside the same family tree.
          SELECT 1 FROM tree_memberships tm1
          JOIN tree_memberships tm2 ON tm1.tree_id = tm2.tree_id
          WHERE tm1.user_id = viewer_id AND tm2.user_id = author_id
      )
    )
    OR (
      vis = '1st_degree' AND EXISTS (
         -- 1st degree: Immediate Family + In laws. 
         -- Handled by checking graph distance of <= 2 hops in family_relationships.
         WITH my_fms AS (
            SELECT id FROM family_members WHERE user_id = viewer_id
         ),
         author_fms AS (
            SELECT id FROM family_members WHERE user_id = author_id
         )
         SELECT 1
         FROM my_fms M, author_fms A
         WHERE 
         -- 0 hops (Same linked family member)
         M.id = A.id
         -- 1 hop (Direct Relationship)
         OR EXISTS (
            SELECT 1 FROM family_relationships fr 
            WHERE (fr.from_member_id = M.id AND fr.to_member_id = A.id)
               OR (fr.from_member_id = A.id AND fr.to_member_id = M.id)
         )
         -- 2 hops (In-laws via spouse, Grandparents via parents, Siblings via common parent)
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
$$;

-- 4. Update Policies for feed_posts
DROP POLICY IF EXISTS "Everyone can view posts" ON public.feed_posts;

CREATE POLICY "Users can view feed posts based on visibility" ON public.feed_posts
  FOR SELECT TO authenticated USING (
    public.check_feed_visibility(auth.uid(), user_id, visibility)
  );

-- 5. Update Policies for timeline_events
-- We keep 'Timeline visible to tree members' logically, but we override it or drop it entirely.
DROP POLICY IF EXISTS "Timeline visible to tree members" ON public.timeline_events;

CREATE POLICY "Timeline visible based on visibility restrictions" ON public.timeline_events
  FOR SELECT TO authenticated USING (
    -- For timeline events, check visibility
    public.check_feed_visibility(auth.uid(), created_by, visibility)
    -- Fallback: if created_by is null (system generated), restrict to tree members
    OR (created_by IS NULL AND EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.id = timeline_events.family_member_id
      AND public.is_tree_member(auth.uid(), fm.tree_id)
    ))
  );
