const fs = require('fs');

let content = fs.readFileSync('src/components/feed/FeedList.tsx', 'utf8');

const oldCode = `            const formattedPosts: FeedPost[] = await Promise.all(
                (data as any[]).map(async (post) => {
                    const rawLikes: FeedLike[] = Array.isArray(post.likes) ? post.likes : [];
                    const rawComments: FeedComment[] = Array.isArray(post.comments) ? post.comments : [];
                    const rawRsvps: FeedRsvp[] = Array.isArray(post.rsvps) ? post.rsvps : [];

                    // Sort comments oldest-first
                    rawComments.sort((a, b) =>
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    );

                    // Collect unique profile_ids from comments to batch-fetch profile info
                    const profileIds = [...new Set(rawComments.map(c => c.profile_id))];
                    let profileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};

                    if (profileIds.length > 0) {
                        const { data: profileData } = await supabase
                            .from('profiles')
                            .select('id, full_name, avatar_url')
                            .in('id', profileIds);

                        if (profileData) {
                            profileData.forEach((p: any) => {
                                profileMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
                            });
                        }
                    }

                    // Attach profile info to each comment
                    const enrichedComments: FeedComment[] = rawComments.map(c => ({
                        ...c,
                        profiles: profileMap[c.profile_id] ?? { full_name: null, avatar_url: null },
                    }));

                    return {
                        ...post,
                        likes: rawLikes,
                        comments: enrichedComments,
                        rsvps: rawRsvps,
                        rewards: rewardMap[post.id] || undefined,
                    } as FeedPost;
                })
            );`;

const newCode = `            // ⚡ BOLT OPTIMIZATION: Extract unique profile_ids from all comments across all posts
            // to execute a single batched query instead of one query per post inside the map (N+1 query problem).
            const allRawComments = (data as any[]).flatMap(post => Array.isArray(post.comments) ? post.comments : []);
            const allProfileIds = [...new Set(allRawComments.map(c => c.profile_id))];

            let globalProfileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
            if (allProfileIds.length > 0) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url')
                    .in('id', allProfileIds);

                if (profileData) {
                    profileData.forEach((p: any) => {
                        globalProfileMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
                    });
                }
            }

            const formattedPosts: FeedPost[] = (data as any[]).map((post) => {
                const rawLikes: FeedLike[] = Array.isArray(post.likes) ? post.likes : [];
                const rawComments: FeedComment[] = Array.isArray(post.comments) ? post.comments : [];
                const rawRsvps: FeedRsvp[] = Array.isArray(post.rsvps) ? post.rsvps : [];

                // Sort comments oldest-first
                rawComments.sort((a, b) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );

                // Attach profile info to each comment using the global map
                const enrichedComments: FeedComment[] = rawComments.map(c => ({
                    ...c,
                    profiles: globalProfileMap[c.profile_id] ?? { full_name: null, avatar_url: null },
                }));

                return {
                    ...post,
                    likes: rawLikes,
                    comments: enrichedComments,
                    rsvps: rawRsvps,
                    rewards: rewardMap[post.id] || undefined,
                } as FeedPost;
            });`;

if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync('src/components/feed/FeedList.tsx', content);
    console.log("Success");
} else {
    console.log("Not found");
}
