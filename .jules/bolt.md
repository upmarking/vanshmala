## 2024-10-30 - [React Performance] Optimize Highly Recursive Components
**Learning:** Highly recursive visual components, like `TreeNode` in `src/components/family-tree/TreeNode.tsx`, cause extremely expensive cascading re-renders across the entire tree during state updates in this application.
**Action:** Wrap recursive components in `React.memo()` and strictly wrap any passed handlers (like `handleAddRelative`, `handleViewProfile`) in `useCallback()` to prevent unchanged subtrees from re-rendering.
