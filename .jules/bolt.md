## 2024-05-16 - [React.memo in Recursive Tree Components]
**Learning:** Highly recursive components like `TreeNode` in family tree visualizations suffer from catastrophic cascading re-renders if parent state changes (e.g., opening a dialog).
**Action:** Always wrap recursive visual components in `React.memo()` and ensure handlers passed down to them are wrapped in `useCallback` to prevent deep reconciliation cycles.
## 2024-05-18 - [Batching JSONB Relational Lookups in Supabase]
**Learning:** In Supabase, joining relational data (like User Profiles) to an array of objects stored inside a JSONB column (like comments inside a Feed Post) is complex and often leads developers to execute N+1 queries client-side via `Promise.all` inside a `.map()`.
**Action:** When enriching nested JSONB data from Supabase, always extract a unique `Set` of required relational IDs from the entire dataset first, issue a single `.in()` batched query, build a dictionary map, and then synchronously process the nested arrays.
