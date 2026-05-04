## 2024-05-16 - [React.memo in Recursive Tree Components]
**Learning:** Highly recursive components like `TreeNode` in family tree visualizations suffer from catastrophic cascading re-renders if parent state changes (e.g., opening a dialog).
**Action:** Always wrap recursive visual components in `React.memo()` and ensure handlers passed down to them are wrapped in `useCallback` to prevent deep reconciliation cycles.## 2024-05-17 - [Avoid npm install without explicit need]
**Learning:** Running `npm install` without careful checking can silently mutate `package-lock.json` and introduce unapproved dependencies, which violates the strict constraint of never modifying lockfiles without instruction.
**Action:** Revert unintended modifications (e.g. `git restore package-lock.json`) immediately.
