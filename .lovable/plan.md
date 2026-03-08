

# Emoji Reactions + Post Editing

## 1. Emoji Reactions (replacing single heart)

### Database Migration
Create two new RPCs. The existing `likes` JSONB array gains a `reaction` field per entry (`heart`, `pray`, `celebrate`, `sad`). Old entries without `reaction` are treated as `heart` for backward compatibility.

```sql
CREATE OR REPLACE FUNCTION public.add_feed_reaction(p_post_id uuid, p_profile_id uuid, p_reaction text)
-- Removes existing reaction from user, adds new one with reaction field

CREATE OR REPLACE FUNCTION public.remove_feed_reaction(p_post_id uuid, p_profile_id uuid)
-- Removes user's reaction entirely
```

### Type Changes (`src/types/feed.ts`)
- Add `reaction?: string` to `FeedLike` interface (optional for backward compat)
- Add `ReactionType = 'heart' | 'pray' | 'celebrate' | 'sad'`

### UI Changes (`src/components/feed/FeedItem.tsx`)
- Replace the single Heart button with a reaction bar showing 4 emoji buttons: ❤️ 🙏 🎉 😢
- On mobile: long-press or tap the reaction area to show a horizontal emoji picker popover
- Show grouped reaction counts below (e.g., "❤️ 3 · 🙏 2 · 🎉 1")
- Highlight the user's current reaction; tapping same reaction again removes it
- Calls `add_feed_reaction` / `remove_feed_reaction` RPCs

```text
┌──────────────────────────────┐
│  ❤️ 🙏 🎉 😢   💬  🎁  ↗  │  ← reaction picker inline
│  ❤️3 · 🙏2              │  ← summary below
└──────────────────────────────┘
```

## 2. Post Editing

### No DB changes needed
The `feed_posts` table already has an UPDATE RLS policy for post owners.

### UI Changes (`src/components/feed/FeedItem.tsx`)
- Add "Edit Post" option in the owner's DropdownMenu (alongside visibility and delete)
- When clicked, show an inline edit mode: replace the content text with a Textarea pre-filled with current content
- Show Save/Cancel buttons
- On save: `supabase.from('feed_posts').update({ content }).eq('id', post.id)`
- Show "(edited)" label next to timestamp if `updated_at > created_at`

## File Summary

| File | Change |
|------|--------|
| Migration SQL | `add_feed_reaction` + `remove_feed_reaction` RPCs |
| `src/types/feed.ts` | Add `reaction` to `FeedLike`, add `ReactionType` |
| `src/components/feed/FeedItem.tsx` | Emoji reaction picker, edit mode, "(edited)" label |

