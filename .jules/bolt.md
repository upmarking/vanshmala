## 2024-05-16 - [React.memo in Recursive Tree Components]
**Learning:** Highly recursive components like `TreeNode` in family tree visualizations suffer from catastrophic cascading re-renders if parent state changes (e.g., opening a dialog).
**Action:** Always wrap recursive visual components in `React.memo()` and ensure handlers passed down to them are wrapped in `useCallback` to prevent deep reconciliation cycles.## 2026-05-22 - [Batched Profile Lookups for Feed Comments]
**Learning:** Fetching profiles for comments on a per-post basis inside a .map() creates an N+1 query bottleneck.
**Action:** Extract unique IDs from all posts' comments and batch-fetch them using a single .in() query outside the loop.
