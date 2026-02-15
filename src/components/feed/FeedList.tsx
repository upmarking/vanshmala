
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FeedPost } from "@/types/feed";
import { FeedItem } from "./FeedItem";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FeedListProps {
    refreshTrigger: number;
}

export const FeedList = ({ refreshTrigger }: FeedListProps) => {
    const [posts, setPosts] = useState<FeedPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('feed_posts')
                    .select(`
            id,
            user_id,
            content,
            post_type,
            created_at,
            updated_at,
            profiles:user_id (
              full_name,
              avatar_url
            )
          `)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setPosts(data as unknown as FeedPost[]);
            } catch (error) {
                console.error("Error fetching posts:", error);
                toast.error("Failed to load feed");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPosts();
    }, [refreshTrigger]);

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
                <FeedItem key={post.id} post={post} />
            ))}
        </div>
    );
};
