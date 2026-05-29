## 2024-05-16 - [React.memo in Recursive Tree Components]
**Learning:** Highly recursive components like `TreeNode` in family tree visualizations suffer from catastrophic cascading re-renders if parent state changes (e.g., opening a dialog).
**Action:** Always wrap recursive visual components in `React.memo()` and ensure handlers passed down to them are wrapped in `useCallback` to prevent deep reconciliation cycles.
## 2024-05-23 - [N+1 Query Bottleneck in Array Mapping]
**Learning:** Executing individual Supabase queries inside `Promise.all` `.map()` loops for relational data (like fetching commenter profiles) creates N+1 performance bottlenecks.
**Action:** Extract unique IDs from the main dataset, execute a single batched `.in()` query outside the loop, build a lookup dictionary, and map the results synchronously.
