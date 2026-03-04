-- ============================================
-- BACKFILL + RLS FIX for existing linked members
-- Problem: existing family_members rows with user_id have NO tree_memberships entry.
-- The secondary safety-net in Dashboard also fails because the SELECT RLS on
-- family_members requires is_tree_member() -> tree_memberships to already exist.
-- Fix:
--   1. Add RLS policy so users can always read their OWN family_members rows
--   2. Backfill tree_memberships for all existing linked members
-- ============================================

-- 1. RLS FIX: allow a user to see rows in family_members where user_id = their auth uid
--    (This is safe: it only exposes a user's own record, not other people's.)
CREATE POLICY "Users can view own family member row"
  ON public.family_members FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);


-- 2. BACKFILL: create tree_memberships for everyone who is already in family_members
--    but has no matching tree_memberships entry.
INSERT INTO public.tree_memberships (tree_id, user_id, member_id, role)
SELECT DISTINCT ON (fm.user_id, fm.tree_id)
  fm.tree_id,
  fm.user_id,
  fm.id AS member_id,
  'member' AS role
FROM public.family_members fm
WHERE fm.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.tree_memberships tm
    WHERE tm.tree_id = fm.tree_id
      AND tm.user_id = fm.user_id
  )
ON CONFLICT (tree_id, user_id) DO UPDATE
  SET member_id = EXCLUDED.member_id;
