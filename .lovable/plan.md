

# Post Sub-Types: Themed Invitation & Announcement Cards

## Overview

Add a `sub_type` column to `feed_posts` so "Invite" posts can be categorized as **Casual, Festival, Birthday, or Marriage**, and "Announcement" posts as **Achievement, Celebration, or Donation**. Each sub-type gets a visually distinct, themed card design with a collapsed preview tile and an expandable detailed view.

## Visual Design

```text
┌─────────────────────────────────┐
│  🕉 Marriage Invitation         │  ← Collapsed tile (ornate border,
│  ✨ [Author Name]               │     saffron/gold gradient, Ganesh ji icon)
│  Tap to view                    │
└─────────────────────────────────┘

  ↓ On click, expands to:

┌─────────────────────────────────┐
│  🕉 Shree Ganeshaya Namah 🕉    │  ← Header with Ganesh motif
│  ─────────────────────────────  │
│  [Post content / message]       │
│  ─────────────────────────────  │
│  ❤️ 💬 🎁 Share                 │
└─────────────────────────────────┘

Birthday → 🎂 cake icon, confetti gradient (pink/purple)
Festival → 🪔 diya icon, festive orange/yellow
Casual   → 📨 simple clean card
Achievement → 🏆 trophy, gold shimmer
Celebration → 🎉 party, colorful
Donation → 🙏 hands, green/earth tones
```

## Database Change

**Migration**: Add nullable `sub_type` text column to `feed_posts`.

```sql
ALTER TABLE public.feed_posts ADD COLUMN sub_type text DEFAULT NULL;
```

No RLS changes needed — existing policies cover the column automatically.

## Type Changes

**`src/types/feed.ts`**
- Add `InviteSubType = 'casual' | 'festival' | 'birthday' | 'marriage'`
- Add `AnnouncementSubType = 'achievement' | 'celebration' | 'donation'`
- Add `sub_type` to `FeedPost` interface

**`src/integrations/supabase/types.ts`**
- Add `sub_type: string | null` to feed_posts Row/Insert/Update

## Frontend Changes

**`src/components/feed/CreatePost.tsx`**
- When post_type is "invite", show a second Select for sub-type (Casual, Festival, Birthday, Marriage)
- When post_type is "announcement", show sub-type Select (Achievement, Celebration, Donation)
- Pass `sub_type` in the insert call

**`src/components/feed/InviteCard.tsx` (New)**
- Themed card component that renders based on sub_type
- **Marriage**: Saffron/gold ornate border, 🕉 Ganesh ji SVG header, decorative paisley corners, "शुभ विवाह" text
- **Birthday**: Pink/purple gradient border, 🎂 cake icon, confetti dots animation, "Happy Birthday" banner
- **Festival**: Orange/yellow diya border, 🪔 icon, rangoli-style decorations
- **Casual**: Clean minimal card with 📨 icon
- Collapsed state: Shows themed tile with sub-type label + "Tap to view"
- Expanded state: Reveals full message content with themed header

**`src/components/feed/AnnouncementCard.tsx` (New)**
- **Achievement**: Gold shimmer border, 🏆 trophy icon
- **Celebration**: Colorful confetti border, 🎉 party icon
- **Donation**: Green/earth border, 🙏 folded hands icon
- Similar collapse/expand behavior

**`src/components/feed/FeedItem.tsx`**
- For invite/announcement posts with a sub_type, render the themed card component instead of plain text content
- Keep all existing actions (like, comment, anshdaan, share) below the card

## File Summary

| File | Change |
|------|--------|
| Migration SQL | Add `sub_type` column to `feed_posts` |
| `src/integrations/supabase/types.ts` | Add `sub_type` field |
| `src/types/feed.ts` | Add sub-type unions |
| `src/components/feed/CreatePost.tsx` | Conditional sub-type selector |
| `src/components/feed/InviteCard.tsx` | New themed invite card with collapse/expand |
| `src/components/feed/AnnouncementCard.tsx` | New themed announcement card |
| `src/components/feed/FeedItem.tsx` | Render themed cards for sub-typed posts |

