
ALTER TABLE public.feed_posts ADD COLUMN rsvps jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION public.set_feed_rsvp(p_post_id uuid, p_profile_id uuid, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.feed_posts
  SET rsvps = (
    SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
    FROM jsonb_array_elements(rsvps) AS elem
    WHERE elem->>'profile_id' <> p_profile_id::text
  ) || jsonb_build_array(jsonb_build_object(
    'profile_id', p_profile_id::text,
    'status', p_status,
    'created_at', now()
  ))
  WHERE id = p_post_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_feed_rsvp(p_post_id uuid, p_profile_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.feed_posts
  SET rsvps = (
    SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
    FROM jsonb_array_elements(rsvps) AS elem
    WHERE elem->>'profile_id' <> p_profile_id::text
  )
  WHERE id = p_post_id;
END;
$$;
