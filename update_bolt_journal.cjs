const fs = require('fs');

const logEntry = `
## 2024-05-24 - [Avoid N+1 queries in Promise.all for Feed Posts]
**Learning:** Directly executing Supabase queries inside \`Promise.all(posts.map(async post => ...))\` causes N+1 query performance bottlenecks.
**Action:** Extract all unique IDs needed across all array items upfront, run a single batched \`.in()\` query, and use a lookup map to process the items synchronously.
`;

fs.appendFileSync('.jules/bolt.md', logEntry);
console.log("Journal updated");
