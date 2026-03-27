## 2024-05-18 - [Optimize TreeNode Render]
**Learning:** The `TreeNode` component is deeply nested and recursive, rendering the entire family tree. Before optimization, any state change in the parent `FamilyTree` component (e.g. updating the active member profile) caused a re-render of every single `TreeNode` because it was not memoized.
**Action:** Wrapped `TreeNode` in `React.memo` to prevent cascading re-renders. When optimizing deeply nested recursive components in this application, ensure they are memoized to skip rendering sub-trees whose props have not changed.
