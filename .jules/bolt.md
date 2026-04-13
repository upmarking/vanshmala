## 2026-03-08 - [React Tree Node Memoization]
**Learning:** Highly recursive visual components like 'TreeNode' and its visually heavy children (e.g., 'SinglePersonCard', 'CoupleCard') can cause expensive cascading re-renders during state updates.
**Action:** Always wrap these components in React.memo() and explicitly set their .displayName property to comply with ESLint rules and improve debugging.
