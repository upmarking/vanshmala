## 2024-05-16 - [React.memo in Recursive Tree Components]
**Learning:** Highly recursive components like `TreeNode` in family tree visualizations suffer from catastrophic cascading re-renders if parent state changes (e.g., opening a dialog).
**Action:** Always wrap recursive visual components in `React.memo()` and ensure handlers passed down to them are wrapped in `useCallback` to prevent deep reconciliation cycles.
## 2024-05-26 - [N+1 Supabase Queries in React Mappings]
**Learning:** Executing Supabase queries inside `.map()` loops via `Promise.all()` creates a severe N+1 bottleneck, particularly in feeds where each post performs its own query to fetch related JSONB user profiles.
**Action:** Always extract unique IDs across the entire dataset first, execute a single batched `.in()` query outside the loop, and build a lookup dictionary to process the `.map()` synchronously.
