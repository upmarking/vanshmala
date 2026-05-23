## 2024-05-23 - N+1 Profile Lookups in FeedList
**Learning:** Supabase queries inside `Promise.all` over `.map()` on a dataset creates N+1 performance bottlenecks. Even if the inner query batches IDs per iteration, it still fires an HTTP request for every post.
**Action:** Extract unique IDs from all records in the dataset beforehand, execute a single batched `.in()` query, and use a lookup dictionary to process the `.map()` synchronously.
