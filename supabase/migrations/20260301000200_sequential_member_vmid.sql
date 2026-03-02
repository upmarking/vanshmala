-- Unified sequential VM-XXXX IDs for BOTH profiles and family_members.
-- All IDs (registered users + manually added tree members) share the same counter
-- so there are no gaps, no duplicates, and no FM- vs VM- confusion.

-- Step 1: Update generate_vanshmala_id() to check BOTH tables for the max number
CREATE OR REPLACE FUNCTION public.generate_vanshmala_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_id INT;
  result TEXT;
BEGIN
  -- Find the highest numeric suffix across BOTH profiles and family_members
  SELECT COALESCE(MAX(num), 0) + 1
  INTO next_id
  FROM (
    SELECT CAST(NULLIF(regexp_replace(vanshmala_id, '[^0-9]', '', 'g'), '') AS INT) AS num
    FROM public.profiles
    WHERE vanshmala_id LIKE 'VM-%'
    UNION ALL
    SELECT CAST(NULLIF(regexp_replace(vanshmala_id, '[^0-9]', '', 'g'), '') AS INT) AS num
    FROM public.family_members
    WHERE vanshmala_id LIKE 'VM-%'
  ) AS all_ids;

  result := 'VM-' || LPAD(next_id::TEXT, 4, '0');
  RETURN result;
END;
$$;

-- Step 2: Set family_members.vanshmala_id default to use the same shared generator
ALTER TABLE public.family_members
  ALTER COLUMN vanshmala_id SET DEFAULT public.generate_vanshmala_id();

-- Step 3: Allow NULL so delink (delete row) path works without constraint issues
ALTER TABLE public.family_members ALTER COLUMN vanshmala_id DROP NOT NULL;

-- Step 4: Backfill existing BAD random IDs in family_members (e.g. VM-21e601)
-- A "bad" ID is one that doesn't match the VM-XXXX 4-digit padded format
-- We fix them one by one to ensure each gets a unique sequential number
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT id FROM public.family_members
    WHERE vanshmala_id IS NOT NULL
      AND vanshmala_id !~ '^VM-[0-9]{4}$'
    ORDER BY created_at ASC
  LOOP
    UPDATE public.family_members
    SET vanshmala_id = public.generate_vanshmala_id()
    WHERE id = rec.id;
  END LOOP;
END;
$$;
