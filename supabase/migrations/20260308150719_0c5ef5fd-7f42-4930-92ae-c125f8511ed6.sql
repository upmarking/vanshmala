
-- Replace add_feed_like with add_feed_reaction (supports reaction field)
CREATE OR REPLACE FUNCTION public.add_feed_reaction(p_post_id uuid, p_profile_id uuid, p_reaction text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  -- Remove any existing reaction from this user first
  UPDATE public.feed_posts
  SET likes = (
    SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
    FROM jsonb_array_elements(likes) AS elem
    WHERE elem->>'profile_id' <> p_profile_id::text
  )
  WHERE id = p_post_id;

  -- Add the new reaction
  UPDATE public.feed_posts
  SET likes = likes || jsonb_build_array(jsonb_build_object(
    'profile_id', p_profile_id::text,
    'reaction', p_reaction,
    'created_at', now()
  ))
  WHERE id = p_post_id;
END;
$$;

-- Remove a user's reaction entirely
CREATE OR REPLACE FUNCTION public.remove_feed_reaction(p_post_id uuid, p_profile_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
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
