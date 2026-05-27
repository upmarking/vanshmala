## 2024-05-16 - [React.memo in Recursive Tree Components]
**Learning:** Highly recursive components like `TreeNode` in family tree visualizations suffer from catastrophic cascading re-renders if parent state changes (e.g., opening a dialog).
**Action:** Always wrap recursive visual components in `React.memo()` and ensure handlers passed down to them are wrapped in `useCallback` to prevent deep reconciliation cycles.
## 2026-05-27 - [N+1 Queries in Array Maps]
**Learning:** N+1 queries can be hidden inside `Promise.all(data.map(async...))` blocks, especially when enriching nested relational data like comments inside a post feed.
**Action:** Extract unique IDs across all parent records, execute a single global `.in()` query before the loop, and use a dictionary lookup to process the `.map()` synchronously.
