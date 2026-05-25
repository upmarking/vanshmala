## 2024-05-16 - [React.memo in Recursive Tree Components]
**Learning:** Highly recursive components like `TreeNode` in family tree visualizations suffer from catastrophic cascading re-renders if parent state changes (e.g., opening a dialog).
**Action:** Always wrap recursive visual components in `React.memo()` and ensure handlers passed down to them are wrapped in `useCallback` to prevent deep reconciliation cycles.
## 2024-05-18 - [Frontend N+1 Queries in `.map` loops]
**Learning:** Performing asynchronous database queries (e.g., `supabase.from...`) inside a `.map` loop wrapped in `Promise.all` causes N+1 performance bottlenecks and memory pressure, especially on frontend lists like social feeds.
**Action:** Always extract all unique foreign keys (e.g., `profile_id`) across the entire dataset before mapping, execute a single `.in()` query to build a lookup dictionary, and perform a synchronous `.map` to enrich the data.
