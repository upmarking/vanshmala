

# Anshdaan (अंशदान) — Gamified Post Contributions

## What We're Building

A gamified gifting system on feed posts with 4 reward tiers represented by animated icons. Contributors can gift money to post creators directly from any post. Only reward counts are shown publicly — never amounts.

## Reward Tiers

```text
🍃 Leaf    →  ₹11
🌹 Rose    →  ₹101
💎 Diamond →  ₹501
⭐ Star    →  ₹1111
```

## Database Changes

**New table: `post_contributions`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| post_id | uuid | FK to feed_posts.id |
| contributor_profile_id | uuid | Who gave |
| reward_type | text | 'leaf', 'rose', 'diamond', 'star' |
| amount | numeric | 11, 101, 501, 1111 |
| created_at | timestamptz | default now() |

RLS: Authenticated users can insert (own profile_id). Everyone can SELECT (to show counts).

**New RPC: `process_post_contribution`**
- Accepts: post_id, contributor_profile_id, reward_type
- Maps reward_type to amount
- Looks up contributor's user_id from profiles, deducts from their wallet via existing deduction logic
- Looks up post creator's user_id from feed_posts → profiles, credits their wallet via `process_wallet_transfer`
- Inserts record into `post_contributions`
- All in one transaction (security definer)

## Frontend Changes

**`src/components/feed/FeedItem.tsx`**
- Add an "Anshdaan" button in the actions row (between like/comment and share)
- Clicking opens a popover/bottom-sheet with 4 animated reward options (Leaf, Rose, Diamond, Star) using CSS animations (bounce/pulse on hover)
- Each option shows the emoji/icon + tier name (no price shown to others; price shown only to the person about to contribute as confirmation)
- After selecting, show a confirmation dialog: "Gift a 🍃 Leaf to [Name]? ₹11 will be deducted from your Dhan wallet."
- On confirm, call the RPC

**Reward counts display on posts**
- Below post content (or inline with actions), show earned rewards as small badges: e.g., `🍃 3  🌹 1  ⭐ 2`
- Only show tiers that have at least 1 contribution
- Fetch counts via a query grouped by reward_type for each post

**`src/types/feed.ts`**
- Add contribution counts to FeedPost type

## File Changes

| File | Change |
|------|--------|
| Migration SQL | Create `post_contributions` table + `process_post_contribution` RPC |
| `src/components/feed/FeedItem.tsx` | Add Anshdaan button, popover with 4 animated tiers, confirmation dialog, reward badges display |
| `src/components/feed/FeedList.tsx` | Fetch contribution counts alongside posts |
| `src/types/feed.ts` | Add contribution types |

