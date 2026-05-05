## 2024-05-16 - [React.memo in Recursive Tree Components]
**Learning:** Highly recursive components like `TreeNode` in family tree visualizations suffer from catastrophic cascading re-renders if parent state changes (e.g., opening a dialog).
**Action:** Always wrap recursive visual components in `React.memo()` and ensure handlers passed down to them are wrapped in `useCallback` to prevent deep reconciliation cycles.

## 2024-05-17 - [N+1 Profiles Query in FeedList]
**Learning:** React components containing loops over relational data (e.g., fetching profiles for all comments in a feed) frequently hide an N+1 query vulnerability if they execute inside a `.map` wrapped in `Promise.all`.
**Action:** Extract unique target IDs before iterating, execute a single `in()` query to batch fetch related data into a global lookup dictionary, and then synchronously map the enriched data to avoid cascading queries.
