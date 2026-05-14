## 2024-05-16 - [React.memo in Recursive Tree Components]
**Learning:** Highly recursive components like `TreeNode` in family tree visualizations suffer from catastrophic cascading re-renders if parent state changes (e.g., opening a dialog).
**Action:** Always wrap recursive visual components in `React.memo()` and ensure handlers passed down to them are wrapped in `useCallback` to prevent deep reconciliation cycles.## 2026-05-14 - [N+1 query in .map with Promise.all]
**Learning:** Executing database lookups inside a .map() mapped via Promise.all causes an N+1 query pattern, which creates severe performance bottlenecks as the number of rows (e.g. posts) increases.
**Action:** Extract all required unique IDs (like profile IDs from comments) across the entire dataset before mapping. Execute a single global batched `.in()` query, then map synchronously using a lookup dictionary built from that query.
