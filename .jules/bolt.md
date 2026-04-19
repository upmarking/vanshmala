## 2024-04-19 - [Fixing Promise.all Supabase Profile N+1 Query]
**Learning:** Found an architecture pattern in `src/components/feed/FeedList.tsx` where comment profiles were being fetched inside a `Promise.all` loop across N posts (an N+1 query variant).
**Action:** Always inspect `.map` loops containing asynchronous `supabase.from()` calls, especially when formatting lists of items containing sub-relations (like comments). Batch fetch all relation IDs upfront into a single `Set` before the `.map`, and perform a single `in()` query.
