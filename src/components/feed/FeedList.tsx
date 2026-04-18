
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FeedPost, FeedLike, FeedComment, FeedRsvp, RewardCounts } from "@/types/feed";
import { FeedItem } from "./FeedItem";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FeedListProps {
    refreshTrigger: number;
    filterType?: string;
}

export const FeedList = ({ refreshTrigger, filterType = "all" }: FeedListProps) => {
    const [posts, setPosts] = useState<FeedPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPosts = async () => {
        try {
            let query = supabase
                .from('feed_posts')
                .select(`
                    id,
                    user_id,
                    content,
                    post_type,
                    sub_type,
                    event_date,
                    event_time,
                    visibility,
                    likes,
                    comments,
                    rsvps,
                    created_at,
                    updated_at,
                    profiles:user_id (
                        full_name,
                        avatar_url
                    )
                `);

            if (filterType !== "all") {
                query = query.eq('post_type', filterType);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            // Parse JSONB arrays and enrich comments with profile info
            const postIds = (data as any[]).map(p => p.id);

            // Batch-fetch reward counts for all posts
            let rewardMap: Record<string, RewardCounts> = {};
            if (postIds.length > 0) {
                const { data: contribs } = await supabase
                    .from('post_contributions')
                    .select('post_id, reward_type')
                    .in('post_id', postIds);

                if (contribs) {
                    contribs.forEach((c: any) => {
                        if (!rewardMap[c.post_id]) {
                            rewardMap[c.post_id] = { leaf: 0, rose: 0, diamond: 0, star: 0 };
                        }
                        const rt = c.reward_type as keyof RewardCounts;
                        if (rt in rewardMap[c.post_id]) {
                            rewardMap[c.post_id][rt]++;
                        }
                    });
                }
            }

            // Collect all unique profile_ids from all comments across all posts to prevent N+1 query
            const allProfileIds = new Set<string>();
            (data as any[]).forEach(post => {
                const comments = Array.isArray(post.comments) ? post.comments : [];
                comments.forEach((c: any) => {
                    if (c.profile_id) {
                        allProfileIds.add(c.profile_id);
                    }
                });
            });

            let globalProfileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};

            if (allProfileIds.size > 0) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url')
                    .in('id', Array.from(allProfileIds));

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

                // Attach profile info to each comment using the globally fetched profile map
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
            });

            setPosts(formattedPosts);
        } catch (error: any) {
            console.error("Error fetching posts:", error);
            toast.error("Failed to load feed");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        fetchPosts();
    }, [refreshTrigger, filterType]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No posts yet. Be the first to share something!
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {posts.map((post) => (
                <FeedItem key={post.id} post={post} onPostChange={fetchPosts} />
            ))}
        </div>
    );
};
