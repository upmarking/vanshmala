## 2026-04-14 - [Memoizing Recursive Visual Components]
**Learning:** Highly recursive visual components like 'TreeNode' ('src/components/family-tree/TreeNode.tsx') and its visually heavy children (e.g., 'SinglePersonCard', 'CoupleCard') can cause expensive cascading re-renders during state updates if not properly memoized.
**Action:** When working with recursive tree structures or deeply nested visual components, wrap them in React.memo() and explicitly set their '.displayName' property to comply with ESLint rules and improve debugging. Ensure passed handlers are wrapped in useCallback().
