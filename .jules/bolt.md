## 2024-05-16 - [React.memo in Recursive Tree Components]
**Learning:** Highly recursive components like `TreeNode` in family tree visualizations suffer from catastrophic cascading re-renders if parent state changes (e.g., opening a dialog).
**Action:** Always wrap recursive visual components in `React.memo()` and ensure handlers passed down to them are wrapped in `useCallback` to prevent deep reconciliation cycles.

## 2024-05-16 - [N+1 Queries in React map]
**Learning:** Executing database calls (like Supabase `.in()`) inside `Promise.all` + `.map` array methods creates an N+1 query problem, severely impacting frontend performance when scaling lists.
**Action:** Always extract unique IDs from datasets, execute a single batch database query outside of loops, and construct a lookup dictionary to enrich the data synchronously.
