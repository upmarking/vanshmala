-- ============================================================
-- ROBUST RELATIONSHIP GUARDRAILS
-- Enforces the 4 core relationship rules at the database level:
--   1. No self-relationships
--   2. Max 2 parents per child
--   3. Max 1 spouse per member
--   4. No duplicate relationships
-- Plus: auto-links siblings when a new child is added to a parent.
-- ============================================================

-- ── STEP 1: Ensure UNIQUE index exists (idempotent) ──────────
-- This prevents exact duplicate (from, to, type) rows.
CREATE UNIQUE INDEX IF NOT EXISTS idx_uniq_relationship
  ON public.family_relationships (from_member_id, to_member_id, relationship);

-- ── STEP 2: BEFORE INSERT guardrail trigger ───────────────────
CREATE OR REPLACE FUNCTION public.enforce_relationship_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_count   INTEGER;
  spouse_exists  BOOLEAN;
BEGIN
  -- ── Guard 1: No self-relationship ──────────────────────────
  IF NEW.from_member_id = NEW.to_member_id THEN
    RAISE EXCEPTION 'SELF_RELATION: A member cannot be related to themselves.';
  END IF;

  -- ── Guard 2: Max 2 parents per child (on parent insertions) ──
  IF NEW.relationship = 'parent' THEN
    SELECT COUNT(*) INTO parent_count
    FROM public.family_relationships
    WHERE to_member_id  = NEW.to_member_id
      AND relationship  = 'parent'
      AND from_member_id <> NEW.from_member_id;  -- exclude the row being inserted

    IF parent_count >= 2 THEN
      RAISE EXCEPTION 'MAX_PARENTS: A child cannot have more than 2 parents.';
    END IF;
  END IF;

  -- ── Guard 3: Max 1 spouse per member ─────────────────────────
  IF NEW.relationship = 'spouse' THEN
    -- Check from_member_id side
    SELECT EXISTS (
      SELECT 1 FROM public.family_relationships
      WHERE relationship = 'spouse'
        AND (from_member_id = NEW.from_member_id OR to_member_id = NEW.from_member_id)
    ) INTO spouse_exists;

    IF spouse_exists THEN
      RAISE EXCEPTION 'MAX_SPOUSE: Member % already has a spouse.', NEW.from_member_id;
    END IF;

    -- Check to_member_id side
    SELECT EXISTS (
      SELECT 1 FROM public.family_relationships
      WHERE relationship = 'spouse'
        AND (from_member_id = NEW.to_member_id OR to_member_id = NEW.to_member_id)
    ) INTO spouse_exists;

    IF spouse_exists THEN
      RAISE EXCEPTION 'MAX_SPOUSE: Member % already has a spouse.', NEW.to_member_id;
    END IF;
  END IF;

  -- ── Guard 4: No circular sibling-of-self via alias check ─────
  -- (The UNIQUE index handles exact duplicates; here we block reverse-direction siblings)
  IF NEW.relationship = 'sibling' THEN
    IF EXISTS (
      SELECT 1 FROM public.family_relationships
      WHERE from_member_id = NEW.to_member_id
        AND to_member_id   = NEW.from_member_id
        AND relationship   = 'sibling'
    ) THEN
      -- Already linked in the other direction — silently skip (not an error)
      RETURN NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS before_relationship_insert_validate ON public.family_relationships;
CREATE TRIGGER before_relationship_insert_validate
  BEFORE INSERT ON public.family_relationships
  FOR EACH ROW EXECUTE FUNCTION public.enforce_relationship_rules();

-- ── STEP 3: AFTER INSERT — auto-link siblings ────────────────
-- When member P becomes a parent of child C (i.e. a 'parent' row is inserted)
-- find all OTHER children of P and create sibling links between them and C.
CREATE OR REPLACE FUNCTION public.auto_link_siblings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sibling_id UUID;
BEGIN
  -- Only run for parent relationships
  IF NEW.relationship <> 'parent' THEN
    RETURN NEW;
  END IF;

  -- Find all existing children of the same parent (excluding the new child)
  FOR sibling_id IN
    SELECT to_member_id
    FROM public.family_relationships
    WHERE from_member_id = NEW.from_member_id
      AND relationship   = 'parent'
      AND to_member_id  <> NEW.to_member_id
  LOOP
    -- Link NEW child → existing sibling (canonical: LEAST UUID first)
    INSERT INTO public.family_relationships (tree_id, from_member_id, to_member_id, relationship)
    VALUES (
      NEW.tree_id,
      LEAST(NEW.to_member_id, sibling_id),
      GREATEST(NEW.to_member_id, sibling_id),
      'sibling'
    )
    ON CONFLICT (from_member_id, to_member_id, relationship) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS after_parent_insert_link_siblings ON public.family_relationships;
CREATE TRIGGER after_parent_insert_link_siblings
  AFTER INSERT ON public.family_relationships
  FOR EACH ROW EXECUTE FUNCTION public.auto_link_siblings();

-- ── STEP 4: BACKFILL — create sibling links for existing children ──
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT DISTINCT
      LEAST(r1.to_member_id, r2.to_member_id)    AS c1_id,
      GREATEST(r1.to_member_id, r2.to_member_id) AS c2_id,
      r1.tree_id
    FROM public.family_relationships r1
    JOIN public.family_relationships r2
      ON r1.from_member_id = r2.from_member_id   -- same parent
     AND r1.to_member_id  <> r2.to_member_id     -- different children
     AND r1.relationship   = 'parent'
     AND r2.relationship   = 'parent'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.family_relationships s
      WHERE s.relationship = 'sibling'
        AND s.from_member_id = LEAST(r1.to_member_id, r2.to_member_id)
        AND s.to_member_id   = GREATEST(r1.to_member_id, r2.to_member_id)
    )
  LOOP
    INSERT INTO public.family_relationships (tree_id, from_member_id, to_member_id, relationship)
    VALUES (rec.tree_id, rec.c1_id, rec.c2_id, 'sibling')
    ON CONFLICT (from_member_id, to_member_id, relationship) DO NOTHING;
  END LOOP;
END;
$$;

-- ── STEP 5: Update the existing coparent → spouse trigger ─────
-- Ensure it also respects the max-1-spouse rule by using ON CONFLICT
-- (the BEFORE INSERT trigger handles rejection; here we just make inserts safe)
-- The existing handle_coparent_spouse function already uses ON CONFLICT DO NOTHING,
-- so it will gracefully skip if a spouse already exists. No change needed.
