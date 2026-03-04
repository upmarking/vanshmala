-- ============================================================
-- FIX: enforce_relationship_rules — allow internal trigger inserts
-- ============================================================
-- The previous migration's MAX_SPOUSE check used RAISE EXCEPTION for ALL
-- inserts. This blocked the existing `handle_coparent_spouse` trigger
-- (which was already using ON CONFLICT DO NOTHING) from running silently.
-- Fix: use pg_trigger_depth() to distinguish direct user inserts (raise)
-- from trigger-originated inserts (return NULL = silent skip).
-- ============================================================

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

  -- ── Guard 2: Max 2 parents per child ─────────────────────
  IF NEW.relationship = 'parent' THEN
    SELECT COUNT(*) INTO parent_count
    FROM public.family_relationships
    WHERE to_member_id   = NEW.to_member_id
      AND relationship   = 'parent'
      AND from_member_id <> NEW.from_member_id;

    IF parent_count >= 2 THEN
      RAISE EXCEPTION 'MAX_PARENTS: A child cannot have more than 2 parents.';
    END IF;
  END IF;

  -- ── Guard 3: Max 1 spouse per member ─────────────────────
  IF NEW.relationship = 'spouse' THEN
    -- Check from_member_id side
    SELECT EXISTS (
      SELECT 1 FROM public.family_relationships
      WHERE relationship = 'spouse'
        AND (from_member_id = NEW.from_member_id OR to_member_id = NEW.from_member_id)
    ) INTO spouse_exists;

    IF spouse_exists THEN
      -- If this insert comes from another trigger (e.g. handle_coparent_spouse),
      -- silently skip rather than raising an exception. The ON CONFLICT clause
      -- in that trigger already guards against duplicate rows.
      IF pg_trigger_depth() > 1 THEN
        RETURN NULL;  -- silent skip
      END IF;
      RAISE EXCEPTION 'MAX_SPOUSE: Member % already has a spouse.', NEW.from_member_id;
    END IF;

    -- Check to_member_id side
    SELECT EXISTS (
      SELECT 1 FROM public.family_relationships
      WHERE relationship = 'spouse'
        AND (from_member_id = NEW.to_member_id OR to_member_id = NEW.to_member_id)
    ) INTO spouse_exists;

    IF spouse_exists THEN
      IF pg_trigger_depth() > 1 THEN
        RETURN NULL;  -- silent skip for trigger-originated inserts
      END IF;
      RAISE EXCEPTION 'MAX_SPOUSE: Member % already has a spouse.', NEW.to_member_id;
    END IF;
  END IF;

  -- ── Guard 4: Block reverse-direction sibling duplicates ──
  -- (Forward-duplicate blocked by UNIQUE index via ON CONFLICT)
  IF NEW.relationship = 'sibling' THEN
    IF EXISTS (
      SELECT 1 FROM public.family_relationships
      WHERE from_member_id = NEW.to_member_id
        AND to_member_id   = NEW.from_member_id
        AND relationship   = 'sibling'
    ) THEN
      RETURN NULL;  -- already linked in the other direction — silently skip
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
