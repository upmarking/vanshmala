## 2024-03-24 - [React.memo in Recursive Tree Nodes]
**Learning:** In highly recursive components like family tree nodes, omitting `React.memo` causes the entire tree to re-render when the parent updates state (like UI flags or unrelated fetching), severely impacting performance. Prop callbacks must also be stabilized with `useCallback` for `React.memo` to work.
**Action:** Always wrap recursive display components in `React.memo` and strictly stabilize functions passed as props to them.
