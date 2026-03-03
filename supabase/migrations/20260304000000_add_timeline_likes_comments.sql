-- 1. Create timeline_likes table
CREATE TABLE IF NOT EXISTS public.timeline_likes (
  event_id UUID NOT NULL REFERENCES public.timeline_events(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, profile_id)
);

-- Enable RLS for timeline_likes
ALTER TABLE public.timeline_likes ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies for timeline_likes
CREATE POLICY "Timeline likes are viewable by everyone."
  ON public.timeline_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own likes."
  ON public.timeline_likes FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own likes."
  ON public.timeline_likes FOR DELETE
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- 2. Create timeline_comments table
CREATE TABLE IF NOT EXISTS public.timeline_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.timeline_events(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for timeline_comments
ALTER TABLE public.timeline_comments ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies for timeline_comments
CREATE POLICY "Timeline comments are viewable by everyone."
  ON public.timeline_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own comments."
  ON public.timeline_comments FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own comments."
  ON public.timeline_comments FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own comments."
  ON public.timeline_comments FOR DELETE
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );
