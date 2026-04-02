## 2025-03-09 - [Cascading Re-renders in Recursive UI Components]
**Learning:** Highly recursive visual components like `TreeNode` in family tree visualizations can cause severe performance bottlenecks (cascading re-renders) when their state or a parent's state updates, especially if handlers passed as props change reference on every render.
**Action:** Always wrap heavily recursive components in `React.memo()` and ensure that any handler functions passed to them (like `onAddRelative` or `onViewProfile`) are stabilized using `useCallback()`.
