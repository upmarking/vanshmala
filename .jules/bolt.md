## 2024-05-16 - [React.memo in Recursive Tree Components]
**Learning:** Highly recursive components like `TreeNode` in family tree visualizations suffer from catastrophic cascading re-renders if parent state changes (e.g., opening a dialog).
**Action:** Always wrap recursive visual components in `React.memo()` and ensure handlers passed down to them are wrapped in `useCallback` to prevent deep reconciliation cycles.## 2026-05-11 - [N+1 Query Bottlenecks in Promise.all]
**Learning:** Using `Promise.all` with `.map` to fetch relational data (like user profiles for comments) inside a loop creates classic N+1 query bottlenecks that scale poorly as the number of parent records grows.
**Action:** Extract all unique foreign keys (e.g., `profile_id`) from the entire dataset beforehand, execute a single batched `.in()` query, and map the results locally.
