-- ============================================
-- AUTO-SPOUSE FROM CO-PARENTS
-- When two members are both parents of the same child,
-- automatically create a spouse relationship between them.
-- This makes the family tree robust without requiring manual spouse linking.
-- ============================================

-- Trigger function: fires AFTER a parent relationship is inserted
CREATE OR REPLACE FUNCTION public.handle_coparent_spouse()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  other_parent_id UUID;
BEGIN
  -- Only act on parent relationships
  IF NEW.relationship <> 'parent' THEN
    RETURN NEW;
  END IF;

  -- Find if the current child (to_member_id) already has another parent
  SELECT from_member_id INTO other_parent_id
  FROM public.family_relationships
  WHERE to_member_id  = NEW.to_member_id      -- same child
    AND relationship  = 'parent'
    AND from_member_id <> NEW.from_member_id   -- different parent
  LIMIT 1;

  IF other_parent_id IS NOT NULL THEN
    -- Auto-create spouse relationship: existing parent (other) → new parent
    -- ON CONFLICT handles the unique constraint gracefully
    INSERT INTO public.family_relationships (tree_id, from_member_id, to_member_id, relationship)
    VALUES (NEW.tree_id, other_parent_id, NEW.from_member_id, 'spouse')
    ON CONFLICT (from_member_id, to_member_id, relationship) DO NOTHING;

    -- Also try reverse direction in case that was stored first
    -- (the UNIQUE constraint will silently discard duplicates)
    INSERT INTO public.family_relationships (tree_id, from_member_id, to_member_id, relationship)
    VALUES (NEW.tree_id, NEW.from_member_id, other_parent_id, 'spouse')
    ON CONFLICT (from_member_id, to_member_id, relationship) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_coparent_create_spouse ON public.family_relationships;
CREATE TRIGGER on_coparent_create_spouse
  AFTER INSERT ON public.family_relationships
  FOR EACH ROW EXECUTE FUNCTION public.handle_coparent_spouse();

-- ============================================
-- BACKFILL: create spouse links for existing co-parents who have none
-- ============================================
DO $$
DECLARE
  rec RECORD;
BEGIN
  -- Find all pairs of co-parents (share the same child) that don't yet have a spouse link
  FOR rec IN
    SELECT DISTINCT
      LEAST(r1.from_member_id, r2.from_member_id)    AS p1_id,
      GREATEST(r1.from_member_id, r2.from_member_id)  AS p2_id,
      r1.tree_id
    FROM public.family_relationships r1
    JOIN public.family_relationships r2
      ON r1.to_member_id = r2.to_member_id        -- same child
     AND r1.from_member_id <> r2.from_member_id   -- different parents
     AND r1.relationship = 'parent'
     AND r2.relationship = 'parent'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.family_relationships s
      WHERE s.relationship = 'spouse'
        AND (
          (s.from_member_id = r1.from_member_id AND s.to_member_id = r2.from_member_id)
          OR
          (s.from_member_id = r2.from_member_id AND s.to_member_id = r1.from_member_id)
        )
    )
  LOOP
    -- Insert canonical spouse relationship (p1 → p2, LEAST first for determinism)
    INSERT INTO public.family_relationships (tree_id, from_member_id, to_member_id, relationship)
    VALUES (rec.tree_id, rec.p1_id, rec.p2_id, 'spouse')
    ON CONFLICT (from_member_id, to_member_id, relationship) DO NOTHING;
  END LOOP;
END;
$$;
