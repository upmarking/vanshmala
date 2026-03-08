
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FeedPost } from "@/types/feed";
import { FeedItem } from "@/components/feed/FeedItem";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const SinglePost = () => {
    const { id } = useParams<{ id: string }>();
    const [post, setPost] = useState<FeedPost | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPost = async () => {
        if (!id) return;

        try {
            setIsLoading(true);
            const { data, error } = await supabase
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
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            if (data) {
                const formattedPost = data as unknown as FeedPost;
                if (formattedPost.comments) {
                    formattedPost.comments.sort((a, b) =>
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    );
                }
                setPost(formattedPost);
            }
        } catch (err: any) {
            console.error("Error fetching single post:", err);
            setError(err.message || "Failed to load post");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPost();
    }, [id]);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 container max-w-2xl mx-auto pt-24 pb-12 px-4">
                <div className="mb-6">
                    <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground hover:text-foreground">
                        <Link to="/feed">
                            <ArrowLeft size={16} />
                            Back to Feed
                        </Link>
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : error || !post ? (
                    <div className="text-center py-12 bg-card rounded-xl border border-dashed">
                        <h2 className="text-xl font-semibold mb-2">Post not found</h2>
                        <p className="text-muted-foreground mb-6">The post you are looking for might have been deleted or is no longer public.</p>
                        <Button asChild>
                            <Link to="/feed">Explore Community Feed</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <FeedItem post={post} onPostChange={fetchPost} />
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default SinglePost;
