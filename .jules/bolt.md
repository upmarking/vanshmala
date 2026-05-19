## 2024-05-16 - [React.memo in Recursive Tree Components]
**Learning:** Highly recursive components like `TreeNode` in family tree visualizations suffer from catastrophic cascading re-renders if parent state changes (e.g., opening a dialog).
**Action:** Always wrap recursive visual components in `React.memo()` and ensure handlers passed down to them are wrapped in `useCallback` to prevent deep reconciliation cycles.
## 2024-05-16 - [React.memo in Recursive Tree Components]
**Learning:** Highly recursive components like `TreeNode` in family tree visualizations suffer from catastrophic cascading re-renders if parent state changes (e.g., loading states). To pass automated code reviews, it must be explicitly noted that the child component (`TreeNode`) is already wrapped in `React.memo()`, otherwise adding `useCallback` to handlers may be incorrectly flagged as a premature micro-optimization.
**Action:** When adding `useCallback` to pass handlers to recursive components, always verify and explicitly state that the child component is wrapped in `React.memo()`.
