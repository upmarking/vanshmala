## 2024-05-18 - [Resolve N+1 query in FeedList]
**Learning:** React components that map over fetched data (e.g. Supabase rows) and execute individual network requests inside `.map()` (even with `Promise.all`) create severe N+1 performance bottlenecks.
**Action:** Extract all required lookup IDs upfront, batch the fetch in a single `.in()` Supabase query, and map synchronously using a lookup dictionary.
