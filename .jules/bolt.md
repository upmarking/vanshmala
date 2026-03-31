
## 2025-02-17 - [Optimizing Highly Recursive React Components]
**Learning:** In highly recursive components like family trees where a single node re-renders its children recursively, cascading re-renders across the entire tree can be a major performance bottleneck for large datasets.
**Action:** Always ensure that highly recursive visual components (like `TreeNode`, `SinglePersonCard`, `CoupleCard`) are wrapped in `React.memo()`, and any callback functions passed to them from parent components (e.g., `handleAddRelative`, `handleViewProfile`) are wrapped in `useCallback()` to maintain reference stability and prevent unnecessary re-renders when the parent's state updates.
