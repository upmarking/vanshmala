-- Create Timeline Events Table
CREATE TABLE public.timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  date DATE,
  event_type TEXT CHECK (event_type IN ('birth', 'education', 'career', 'marriage', 'child', 'death', 'other')),
  description TEXT,
  media_urls JSONB DEFAULT '[]'::jsonb, -- Array of {url, type: 'image'|'document', caption}
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for timeline_events
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

-- Timeline Policies
CREATE POLICY "Timeline visible to tree members" ON public.timeline_events
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.id = timeline_events.family_member_id
      AND public.is_tree_member(auth.uid(), fm.tree_id)
    )
  );

CREATE POLICY "Tree members can add timeline events" ON public.timeline_events
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.id = family_member_id
      AND public.is_tree_member(auth.uid(), fm.tree_id)
    )
  );

CREATE POLICY "Tree admins and creator can update timeline events" ON public.timeline_events
  FOR UPDATE TO authenticated USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.id = family_member_id
      AND public.is_tree_admin(auth.uid(), fm.tree_id)
    )
  );

CREATE POLICY "Tree admins and creator can delete timeline events" ON public.timeline_events
  FOR DELETE TO authenticated USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.id = family_member_id
      AND public.is_tree_admin(auth.uid(), fm.tree_id)
    )
  );

-- Create Legacy Messages Table (Vault)
CREATE TABLE public.legacy_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- specific user or null for "all family" (clarify semantics later, assume targeted or general)
-- For MVP, let's assume messages are associated with a generated "Legacy Vault" for a user, which family can access.
-- Actually, the prompt says "Elders can record... Users can schedule 'Unlock message when child turns 18'".
-- This implies a message from A to B (or A to general).
-- Let's link to family_members maybe? OR just auth.users. 
-- Let's stick to auth.users for creator/recipient for now as it's more direct for "Elders" (users) to "Next Gen" (users).
  target_family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL, -- Optional: link to a specific profile in the tree to show this message ON.
  title TEXT NOT NULL,
  content_type TEXT CHECK (content_type IN ('audio', 'video', 'text')) DEFAULT 'text',
  media_url TEXT,
  message_text TEXT,
  unlock_condition TEXT CHECK (unlock_condition IN ('date', 'event', 'after_death')),
  unlock_date DATE, -- For date-based unlock
  is_unlocked BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for legacy_messages
ALTER TABLE public.legacy_messages ENABLE ROW LEVEL SECURITY;

-- Creator can do anything with their messages
CREATE POLICY "Creators can view own messages" ON public.legacy_messages
  FOR SELECT TO authenticated USING (auth.uid() = creator_id);

CREATE POLICY "Creators can insert own messages" ON public.legacy_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own messages" ON public.legacy_messages
  FOR UPDATE TO authenticated USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own messages" ON public.legacy_messages
  FOR DELETE TO authenticated USING (auth.uid() = creator_id);

-- Recipients can view UNLOCKED messages
CREATE POLICY "Recipients can view unlocked messages" ON public.legacy_messages
  FOR SELECT TO authenticated USING (
    (auth.uid() = recipient_id OR recipient_id IS NULL) -- Logic for "who can see" might need refinement for 'public' legacy
    AND (
        unlock_condition = 'date' AND (unlock_date <= CURRENT_DATE OR is_unlocked = true)
        OR
        unlock_condition = 'after_death' AND is_unlocked = true -- Rely on manual unlock or separate trigger for death
    )
  );

-- Trigger for timeline_events updated_at
CREATE TRIGGER update_timeline_events_updated_at
  BEFORE UPDATE ON public.timeline_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for legacy_messages updated_at
CREATE TRIGGER update_legacy_messages_updated_at
  BEFORE UPDATE ON public.legacy_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
