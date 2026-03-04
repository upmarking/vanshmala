-- ============================================
-- AUTO-MEMBERSHIP + NOTIFICATIONS
-- When a family_member row is inserted with a user_id (i.e. a real registered user
-- is linked into the tree), automatically:
--   1. Create a tree_membership row for them (so they see the family on login/reload)
--   2. Create a notification so they know they've been added
-- ============================================

-- 1. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT,
  link       TEXT,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- The trigger function runs as SECURITY DEFINER so it can insert notifications
-- for other users without hitting RLS
CREATE POLICY "Service can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);


-- 2. TRIGGER FUNCTION
-- Fires AFTER INSERT on family_members.
-- If the new member has a user_id, we:
--   a) ensure tree_memberships has a row for that user+tree
--   b) insert a notification for the linked user
CREATE OR REPLACE FUNCTION public.handle_family_member_linked()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family_name TEXT;
BEGIN
  -- Only act when a real user_id is set
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Fetch the family name for the notification body
  SELECT family_name INTO v_family_name
  FROM public.family_trees
  WHERE id = NEW.tree_id;

  -- a) Auto-create tree_membership (ignore if already present)
  INSERT INTO public.tree_memberships (tree_id, user_id, member_id, role)
  VALUES (NEW.tree_id, NEW.user_id, NEW.id, 'member')
  ON CONFLICT (tree_id, user_id) DO UPDATE SET member_id = NEW.id;

  -- b) Notify the user (skip if it's the tree creator adding themselves)
  -- We check: is this INSERT being done by the same user as the linked user_id?
  -- If yes (self-join on create), skip noise.
  IF NEW.added_by IS DISTINCT FROM NEW.user_id THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (
      NEW.user_id,
      'You have been added to a family tree',
      'You were added to the family: ' || COALESCE(v_family_name, 'your family'),
      '/tree/' || NEW.tree_id::TEXT
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 3. ATTACH TRIGGER
DROP TRIGGER IF EXISTS on_family_member_linked ON public.family_members;
CREATE TRIGGER on_family_member_linked
  AFTER INSERT ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_family_member_linked();


-- 4. INDEX for fast notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read
  ON public.notifications (user_id, is_read, created_at DESC);
