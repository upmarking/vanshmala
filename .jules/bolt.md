## 2024-05-16 - [React.memo in Recursive Tree Components]
**Learning:** Highly recursive components like `TreeNode` in family tree visualizations suffer from catastrophic cascading re-renders if parent state changes (e.g., opening a dialog).
**Action:** Always wrap recursive visual components in `React.memo()` and ensure handlers passed down to them are wrapped in `useCallback` to prevent deep reconciliation cycles.
## 2024-05-17 - [Resolving Supabase N+1 Queries in Nested Arrays]
**Learning:** Relational mapping on JSONB arrays (like `comments` inside `feed_posts`) using loops like `.map(async () => ... await supabase)` causes severe N+1 query bottlenecks in Supabase.
**Action:** Extract unique target IDs using `flatMap` and `Set`, perform a single batched `.in()` query outside the loop, build a lookup dictionary, and map synchronously to prevent cascading database requests.
