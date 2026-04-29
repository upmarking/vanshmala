## 2024-05-16 - [React.memo in Recursive Tree Components]
**Learning:** Highly recursive components like `TreeNode` in family tree visualizations suffer from catastrophic cascading re-renders if parent state changes (e.g., opening a dialog).
**Action:** Always wrap recursive visual components in `React.memo()` and ensure handlers passed down to them are wrapped in `useCallback` to prevent deep reconciliation cycles.
## 2024-05-17 - [N+1 query in FeedList]
**Learning:** The application feed used `Promise.all()` with nested Supabase `.in()` queries inside an array map to fetch related commenter profiles, leading to an N+1 problem (one query per post).
**Action:** Avoid `Promise.all()` with network requests inside loops. Extract unique IDs first, make one batched `.in()` query, and use a lookup map to synchronously attach the data.
