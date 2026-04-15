## 2025-02-23 - [N+1 Query Bottleneck in UI Map Loops]
**Learning:** In the feed system, mapping over posts and calling `.in()` queries inside `Promise.all()` caused hidden N+1 bottlenecks.
**Action:** Always collect distinct IDs globally and execute a single batched query before entering component mapping loops.
