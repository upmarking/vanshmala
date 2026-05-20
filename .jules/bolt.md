## 2024-05-16 - [React.memo in Recursive Tree Components]
**Learning:** Highly recursive components like `TreeNode` in family tree visualizations suffer from catastrophic cascading re-renders if parent state changes (e.g., opening a dialog).
**Action:** Always wrap recursive visual components in `React.memo()` and ensure handlers passed down to them are wrapped in `useCallback` to prevent deep reconciliation cycles.
## 2024-05-20 - [N+1 Queries in Parallel Mappings]
**Learning:** Performing multiple Supabase queries inside `Promise.all(arr.map(...))` creates an N+1 performance bottleneck. Even though they run in parallel, it generates excessive database connections and network round-trips.
**Action:** Extract all unique foreign keys (e.g., `profile_id`s) across the entire dataset into a `Set` first, perform a single batched `.in()` query to build a lookup dictionary, and then process the array mapping synchronously.
