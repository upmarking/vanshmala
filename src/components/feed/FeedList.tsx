
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FeedPost } from "@/types/feed";
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
            visibility,
            created_at,
            updated_at,
            profiles:user_id (
              full_name,
              avatar_url
            ),
            feed_likes (
              post_id,
              profile_id,
              created_at
            ),
            feed_comments (
              id,
              post_id,
              profile_id,
              comment,
              created_at,
              profiles:profile_id (
                full_name,
                avatar_url
              )
            )
          `);

            if (filterType !== "all") {
                query = query.eq('post_type', filterType);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            // Sort comments chronologically so newest is at bottom (or top)
            // Typically older comments are at top and newer at bottom. Default order from supabase might be arbitrary or by PK.
            // But we will handle data correctly as is.
            const formattedPosts = (data as unknown as FeedPost[]).map(post => {
                // sort comments if they exist
                if (post.feed_comments) {
                    post.feed_comments.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                }
                return post;
            });
            setPosts(formattedPosts);
        } catch (error: any) {
            console.error("Error fetching posts:", error);
            if (error.code !== '42P01') {
                toast.error("Failed to load feed");
            }
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
