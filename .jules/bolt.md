## 2024-05-16 - [React.memo in Recursive Tree Components]
**Learning:** Highly recursive components like `TreeNode` in family tree visualizations suffer from catastrophic cascading re-renders if parent state changes (e.g., opening a dialog).
**Action:** Always wrap recursive visual components in `React.memo()` and ensure handlers passed down to them are wrapped in `useCallback` to prevent deep reconciliation cycles.## 2026-05-18 - [N+1 Queries in Promise.all]
**Learning:** Using `Promise.all(data.map(async () => { ... await supabase... }))` is an anti-pattern for fetching relational data in Supabase that leads to N+1 queries and severe network bottlenecks.
**Action:** Always hoist database queries outside of map loops. Collect unique IDs into a `Set`, execute a single batched `.in()` query to build a global lookup dictionary, and then map the data synchronously.
