## YYYY-MM-DD - [Title]
**Learning:** [Insight]
**Action:** [How to apply next time]
## 2024-04-07 - [Memoizing Highly Recursive Components]
**Learning:** In a highly recursive component structure like `TreeNode` (`src/components/family-tree/TreeNode.tsx`), any state change in the parent (e.g., toggling a dialog in `FamilyTree.tsx`) triggers a full re-render of the entire tree. Even if the data structure (`rootNode`) is memoized with `useMemo`, React will still re-render all children unless they are explicitly wrapped in `React.memo()` and their props (like event handlers) are referentially stable using `useCallback`. This was causing significant performance bottlenecks when interacting with the tree UI.
**Action:** Always wrap highly recursive UI components (and their internal sub-components like `SinglePersonCard`, `CoupleCard`, etc.) in `React.memo()`. Furthermore, ensure that any functions passed down the recursive chain are wrapped in `useCallback` at the top level to maintain referential equality.
