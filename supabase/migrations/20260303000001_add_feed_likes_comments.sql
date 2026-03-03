-- 1. Create feed_likes table
CREATE TABLE IF NOT EXISTS public.feed_likes (
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, profile_id)
);

-- Enable RLS for feed_likes
ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies for feed_likes
CREATE POLICY "Feed likes are viewable by everyone."
  ON public.feed_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own likes."
  ON public.feed_likes FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own likes."
  ON public.feed_likes FOR DELETE
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- 2. Create feed_comments table
CREATE TABLE IF NOT EXISTS public.feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for feed_comments
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies for feed_comments
CREATE POLICY "Feed comments are viewable by everyone."
  ON public.feed_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own comments."
  ON public.feed_comments FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own comments."
  ON public.feed_comments FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own comments."
  ON public.feed_comments FOR DELETE
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- 3. Ensure feed_posts has delete policy for owners
-- Create policy for deleting own posts (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'feed_posts' 
        AND policyname = 'Users can delete their own posts.'
    ) THEN
        CREATE POLICY "Users can delete their own posts."
        ON public.feed_posts FOR DELETE
        USING (
          user_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
          )
        );
    END IF;
END
$$;
