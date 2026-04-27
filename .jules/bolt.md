## 2024-05-16 - [React.memo in Recursive Tree Components]
**Learning:** Highly recursive components like `TreeNode` in family tree visualizations suffer from catastrophic cascading re-renders if parent state changes (e.g., opening a dialog).
**Action:** Always wrap recursive visual components in `React.memo()` and ensure handlers passed down to them are wrapped in `useCallback` to prevent deep reconciliation cycles.
## 2026-04-27 - [N+1 Query in React Render mapping]
**Learning:** Mapping over an array and executing individual Supabase queries inside  creates severe N+1 bottlenecks. In `src/components/feed/FeedList.tsx`, resolving post comment profiles inside the post map caused this.
**Action:** Extract unique query parameters into a `Set`, execute a single batched `.in()` query beforehand, build a global lookup dictionary, and then map over the array synchronously.

## 2024-05-16 - [N+1 Query in React Render mapping]
**Learning:** Mapping over an array and executing individual Supabase queries inside `Promise.all` creates severe N+1 bottlenecks. In `src/components/feed/FeedList.tsx`, resolving post comment profiles inside the post map caused this.
**Action:** Extract unique query parameters into a `Set`, execute a single batched `.in()` query beforehand, build a global lookup dictionary, and then map over the array synchronously.
