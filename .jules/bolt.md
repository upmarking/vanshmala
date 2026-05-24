## 2024-05-16 - [React.memo in Recursive Tree Components]
**Learning:** Highly recursive components like `TreeNode` in family tree visualizations suffer from catastrophic cascading re-renders if parent state changes (e.g., opening a dialog).
**Action:** Always wrap recursive visual components in `React.memo()` and ensure handlers passed down to them are wrapped in `useCallback` to prevent deep reconciliation cycles.
## 2024-05-24 - [Avoid N+1 queries in Promise.all for Feed Posts]
**Learning:** Directly executing Supabase queries inside `Promise.all(posts.map(async post => ...))` causes N+1 query performance bottlenecks.
**Action:** Extract all unique IDs needed across all array items upfront, run a single batched `.in()` query, and use a lookup map to process the items synchronously.

## 2024-05-24 - [Avoid N+1 queries in Promise.all for Feed Posts]
**Learning:** Directly executing Supabase queries inside `Promise.all(posts.map(async post => ...))` causes N+1 query performance bottlenecks.
**Action:** Extract all unique IDs needed across all array items upfront, run a single batched `.in()` query, and use a lookup map to process the items synchronously.
