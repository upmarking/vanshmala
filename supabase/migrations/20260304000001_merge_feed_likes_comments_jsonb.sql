-- =============================================================
-- MIGRATION: Merge feed_likes + feed_comments into feed_posts
-- as JSONB columns for a single robust table.
-- =============================================================

-- 1. Add JSONB columns to feed_posts
ALTER TABLE public.feed_posts
  ADD COLUMN IF NOT EXISTS likes JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS comments JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. Migrate existing feed_likes → likes JSONB
UPDATE public.feed_posts fp
SET likes = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'profile_id', fl.profile_id,
        'created_at', fl.created_at
      ) ORDER BY fl.created_at ASC
    ),
    '[]'::jsonb
  )
  FROM public.feed_likes fl
  WHERE fl.post_id = fp.id
);

-- 3. Migrate existing feed_comments → comments JSONB
UPDATE public.feed_posts fp
SET comments = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id',         fc.id,
        'profile_id', fc.profile_id,
        'comment',    fc.comment,
        'created_at', fc.created_at
      ) ORDER BY fc.created_at ASC
    ),
    '[]'::jsonb
  )
  FROM public.feed_comments fc
  WHERE fc.post_id = fp.id
);

-- 4. GIN indexes for fast JSONB querying
CREATE INDEX IF NOT EXISTS feed_posts_likes_gin    ON public.feed_posts USING GIN (likes);
CREATE INDEX IF NOT EXISTS feed_posts_comments_gin ON public.feed_posts USING GIN (comments);

-- ---------------------------------------------------------------
-- 5. Helper RPC functions (SECURITY DEFINER – run as table owner)
-- ---------------------------------------------------------------

-- 5a. add_feed_like(post_id, profile_id)
CREATE OR REPLACE FUNCTION public.add_feed_like(p_post_id UUID, p_profile_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only add if not already liked (idempotent)
  UPDATE public.feed_posts
  SET likes = likes || jsonb_build_object(
      'profile_id', p_profile_id::text,
      'created_at', now()
    )::jsonb
  WHERE id = p_post_id
    AND NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(likes) AS elem
      WHERE elem->>'profile_id' = p_profile_id::text
    );
END;
$$;

-- 5b. remove_feed_like(post_id, profile_id)
CREATE OR REPLACE FUNCTION public.remove_feed_like(p_post_id UUID, p_profile_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.feed_posts
  SET likes = (
    SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
    FROM jsonb_array_elements(likes) AS elem
    WHERE elem->>'profile_id' <> p_profile_id::text
  )
  WHERE id = p_post_id;
END;
$$;

-- 5c. add_feed_comment(post_id, profile_id, comment_text) → returns new comment id
CREATE OR REPLACE FUNCTION public.add_feed_comment(
  p_post_id UUID,
  p_profile_id UUID,
  p_comment TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comment_id UUID := gen_random_uuid();
BEGIN
  UPDATE public.feed_posts
  SET comments = comments || jsonb_build_object(
      'id',         v_comment_id::text,
      'profile_id', p_profile_id::text,
      'comment',    p_comment,
      'created_at', now()
    )::jsonb
  WHERE id = p_post_id;
  RETURN v_comment_id;
END;
$$;

-- 5d. remove_feed_comment(post_id, comment_id, profile_id)
--     profile_id check ensures only comment owner can delete
CREATE OR REPLACE FUNCTION public.remove_feed_comment(
  p_post_id UUID,
  p_comment_id UUID,
  p_profile_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.feed_posts
  SET comments = (
    SELECT COALESCE(jsonb_agg(elem ORDER BY (elem->>'created_at') ASC), '[]'::jsonb)
    FROM jsonb_array_elements(comments) AS elem
    WHERE NOT (
      elem->>'id'         = p_comment_id::text
      AND elem->>'profile_id' = p_profile_id::text
    )
  )
  WHERE id = p_post_id;
END;
$$;

-- ---------------------------------------------------------------
-- 6. Drop old tables (data already migrated above)
-- ---------------------------------------------------------------
DROP TABLE IF EXISTS public.feed_comments;
DROP TABLE IF EXISTS public.feed_likes;
