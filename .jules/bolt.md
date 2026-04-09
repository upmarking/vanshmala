## 2024-05-24 - [Recursive Tree Component Memoization]
**Learning:** Highly recursive visual components like `TreeNode` (`src/components/family-tree/TreeNode.tsx`) can cause expensive cascading re-renders during state updates if not properly memoized.
**Action:** Wrap the recursive component and its visually heavy child components (e.g. `SinglePersonCard`, `CoupleCard`) in `React.memo()`. Also, wrap the passed event handlers in `useCallback()` to maintain referential equality across renders, ensuring the memoization actually works.
