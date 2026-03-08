

# RSVP for Invitation Posts

## Overview
Add RSVP functionality to invite posts using the same JSONB-in-row pattern already used for likes and comments. Family members can respond Accept/Decline/Maybe, with counts shown on the invite card.

## Database Changes

**Migration**: Add `rsvps` JSONB column and two RPC functions.

```sql
ALTER TABLE public.feed_posts ADD COLUMN rsvps jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Upsert RSVP (one per user per post)
CREATE OR REPLACE FUNCTION public.set_feed_rsvp(p_post_id uuid, p_profile_id uuid, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  -- Remove existing RSVP from this user, then add new one
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

-- Remove RSVP
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
```

## Type Changes

**`src/types/feed.ts`**: Add `FeedRsvp` interface, add `rsvps` to `FeedPost`.

## Frontend Changes

**`src/components/feed/InviteCard.tsx`**:
- Accept new props: `postId`, `rsvps`, `profileId`, `onPostChange`
- Show 3 RSVP buttons (Accept ✓, Maybe ?, Decline ✗) inside the expanded card
- Display counts: "5 Attending · 2 Maybe · 1 Declined"
- Highlight the user's current selection
- Call `set_feed_rsvp` / `remove_feed_rsvp` RPCs on click

**`src/components/feed/FeedItem.tsx`**: Pass `postId`, `rsvps`, `profileId`, `onPostChange` to InviteCard.

**`src/components/feed/FeedList.tsx`**: Include `rsvps` in the select query.

## File Summary

| File | Change |
|------|--------|
| Migration SQL | Add `rsvps` column + 2 RPCs |
| `src/types/feed.ts` | Add `FeedRsvp`, update `FeedPost` |
| `src/components/feed/InviteCard.tsx` | RSVP buttons + counts UI |
| `src/components/feed/FeedItem.tsx` | Pass RSVP props to InviteCard |
| `src/components/feed/FeedList.tsx` | Select `rsvps` column |

