import { useState } from "react";
import { FeedPost } from "@/types/feed";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Calendar, Megaphone, Heart, Share2, MoreHorizontal, Trash2, Send, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FeedItemProps {
    post: FeedPost;
    onPostChange?: () => void;
}

export const FeedItem = ({ post, onPostChange }: FeedItemProps) => {
    const { profile } = useAuth();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [showComments, setShowComments] = useState(false);

    const isOwner = profile?.id === post.user_id;
    const hasLiked = post.feed_likes?.some(like => like.profile_id === profile?.id) || false;
    const likesCount = post.feed_likes?.length || 0;
    const commentsCount = post.feed_comments?.length || 0;

    const getIcon = () => {
        switch (post.post_type) {
            case 'invite':
                return <Calendar className="h-4 w-4 mr-1" />;
            case 'announcement':
                return <Megaphone className="h-4 w-4 mr-1" />;
            default:
                return <MessageSquare className="h-4 w-4 mr-1" />;
        }
    };

    const getBadgeVariant = () => {
        switch (post.post_type) {
            case 'invite':
                return "secondary";
            case 'announcement':
                return "destructive";
            default:
                return "outline";
        }
    };

    const getBorderColor = () => {
        switch (post.post_type) {
            case 'invite':
                return "border-blue-200 bg-blue-50/10";
            case 'announcement':
                return "border-red-200 bg-red-50/10";
            default:
                return "border-border";
        }
    };

    const handleDelete = async () => {
        if (!isOwner) return;
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('feed_posts')
                .delete()
                .eq('id', post.id);

            if (error) throw error;
            toast.success("Post deleted safely");
            if (onPostChange) onPostChange();
        } catch (error) {
            console.error("Error deleting post:", error);
            toast.error("Failed to delete post.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleLikeToggle = async () => {
        if (!profile?.id) {
            toast.error("You must be logged in to like a post.");
            return;
        }

        setIsLiking(true);
        try {
            if (hasLiked) {
                // Unlike
                const { error } = await supabase
                    .from('feed_likes')
                    .delete()
                    .eq('post_id', post.id)
                    .eq('profile_id', profile.id);
                if (error) throw error;
            } else {
                // Like
                const { error } = await supabase
                    .from('feed_likes')
                    .insert({ post_id: post.id, profile_id: profile.id });
                if (error) throw error;
            }
            if (onPostChange) onPostChange();
        } catch (error: any) {
            console.error("Error toggling like:", error);
            if (error.code === '42P01') {
                toast.error("Database updating... Please apply the feed updates script first.");
            } else {
                toast.error("Failed to update like status.");
            }
        } finally {
            setIsLiking(false);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || !profile?.id) return;

        setIsSubmittingComment(true);
        try {
            const { error } = await supabase
                .from('feed_comments')
                .insert({
                    post_id: post.id,
                    profile_id: profile.id,
                    comment: commentText.trim()
                });

            if (error) throw error;
            setCommentText("");
            if (onPostChange) onPostChange();
        } catch (error: any) {
            console.error("Error adding comment:", error);
            if (error.code === '42P01') {
                toast.error("Database updating... Please apply the feed updates script first.");
            } else {
                toast.error("Failed to add comment.");
            }
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Check out this post on VanshMala',
                text: post.content,
                url: window.location.href, // Or generate a specific deep link
            }).catch(console.error);
        } else {
            // Fallback to copy to clipboard
            navigator.clipboard.writeText(post.content);
            toast.success("Post text copied to clipboard!");
        }
    }

    return (
        <Card className={`mb-6 overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow ${getBorderColor()}`}>
            <CardHeader className="flex flex-row items-center gap-3 p-4 pb-2">
                <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={post.profiles?.avatar_url || ''} />
                    <AvatarFallback className="bg-gradient-saffron text-primary-foreground text-xs">
                        {post.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{post.profiles?.full_name || 'Unknown User'}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {post.post_type !== 'post' && (
                        <Badge variant={getBadgeVariant()} className="hidden sm:flex items-center capitalize h-6 px-2 text-xs">
                            {getIcon()}
                            {post.post_type}
                        </Badge>
                    )}

                    {isOwner && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-red-500 focus:text-red-500">
                                    {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                    Delete Post
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="px-4 pb-3">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>
                </div>
            </CardContent>

            <CardFooter className="flex flex-col p-0">
                {/* Actions row */}
                <div className="w-full flex items-center justify-between px-2 py-1 border-t border-border/50">
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`gap-1.5 px-3 rounded-full hover:bg-red-50 hover:text-red-500 ${hasLiked ? 'text-red-500' : 'text-muted-foreground'}`}
                            onClick={handleLikeToggle}
                            disabled={isLiking}
                        >
                            <Heart className={`h-5 w-5 ${hasLiked ? 'fill-current' : ''}`} />
                            {likesCount > 0 && <span className="text-sm font-medium">{likesCount}</span>}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 px-3 rounded-full text-muted-foreground hover:bg-blue-50 hover:text-blue-500"
                            onClick={() => setShowComments(!showComments)}
                        >
                            <MessageCircle className="h-5 w-5" />
                            {commentsCount > 0 && <span className="text-sm font-medium">{commentsCount}</span>}
                        </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="px-3 rounded-full text-muted-foreground hover:bg-gray-100" onClick={handleShare}>
                        <Share2 className="h-5 w-5" />
                    </Button>
                </div>

                {/* Comments Section */}
                {showComments && (
                    <div className="w-full bg-muted/20 border-t border-border/50 px-4 py-3 animate-in slide-in-from-top-2 duration-200">
                        {/* Add Comment */}
                        <form onSubmit={handleCommentSubmit} className="flex gap-2 items-center mb-4">
                            <Avatar className="h-7 w-7 border border-border">
                                <AvatarImage src={profile?.avatar_url || ''} />
                                <AvatarFallback className="bg-primary/10 text-xs">
                                    {profile?.full_name?.charAt(0)?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <Input
                                placeholder="Write a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                className="h-9 rounded-full bg-background border-border/50 text-sm focus-visible:ring-1 focus-visible:ring-saffron/50"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 shrink-0 text-saffron hover:bg-saffron/10 hover:text-saffron-600 rounded-full"
                                disabled={!commentText.trim() || isSubmittingComment}
                            >
                                {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </form>

                        {/* Existing Comments */}
                        {post.feed_comments && post.feed_comments.length > 0 ? (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {post.feed_comments.map(comment => (
                                    <div key={comment.id} className="flex gap-2.5">
                                        <Avatar className="h-7 w-7 shrink-0 border border-border/50 mt-1">
                                            <AvatarImage src={comment.profiles?.avatar_url || ''} />
                                            <AvatarFallback className="bg-primary/5 text-[10px]">
                                                {comment.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col bg-background/60 hover:bg-background/80 transition-colors border border-border/40 rounded-2xl rounded-tl-sm px-3 pt-2 pb-2.5 shadow-sm text-sm break-words flex-1">
                                            <span className="font-semibold text-xs text-foreground/80 mb-0.5">
                                                {comment.profiles?.full_name || 'Unknown'}
                                            </span>
                                            <span className="text-foreground/90">{comment.comment}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-2 pb-1 text-xs text-muted-foreground">
                                No comments yet. Be the first to start the conversation!
                            </div>
                        )}
                    </div>
                )}
            </CardFooter>
        </Card>
    );
};
