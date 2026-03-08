
import { useState } from "react";
import { Link } from "react-router-dom";
import { FeedPost, ReactionType } from "@/types/feed";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Calendar, Pin, Share2, MoreHorizontal, Trash2, Send, Loader2, Globe, Users, Lock, Eye, Pencil, X, Check } from "lucide-react";
import { AnshdaanButton, RewardBadges } from "./AnshdaanButton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { InviteCard } from "./InviteCard";
import { AnnouncementCard } from "./AnnouncementCard";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
    { type: 'heart', emoji: '❤️', label: 'Love' },
    { type: 'pray', emoji: '🙏', label: 'Pray' },
    { type: 'celebrate', emoji: '🎉', label: 'Celebrate' },
    { type: 'sad', emoji: '😢', label: 'Sad' },
];

interface FeedItemProps {
    post: FeedPost;
    onPostChange?: () => void;
}

export const FeedItem = ({ post, onPostChange }: FeedItemProps) => {
    const { profile } = useAuth();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isReacting, setIsReacting] = useState(false);
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [showComments, setShowComments] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const isOwner = profile?.id === post.user_id;

    // Reaction helpers
    const myReaction = post.likes?.find(l => l.profile_id === profile?.id);
    const myReactionType: ReactionType | null = myReaction ? (myReaction.reaction || 'heart') : null;

    const reactionCounts: Partial<Record<ReactionType, number>> = {};
    (post.likes || []).forEach(l => {
        const r: ReactionType = l.reaction || 'heart';
        reactionCounts[r] = (reactionCounts[r] || 0) + 1;
    });
    const totalReactions = post.likes?.length || 0;
    const commentsCount = post.comments?.length || 0;

    const isEdited = post.updated_at && post.created_at &&
        new Date(post.updated_at).getTime() - new Date(post.created_at).getTime() > 1000;

    const getBorderColor = () => {
        switch (post.post_type) {
            case 'invite':
                return "border-blue-200 bg-blue-50/10";
            case 'announcement':
                return "border-saffron/30 bg-saffron/5";
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
            setShowDeleteDialog(false);
        }
    };

    const handleVisibilityChange = async (newVisibility: string) => {
        setIsUpdatingVisibility(true);
        try {
            const { error } = await supabase
                .from('feed_posts')
                .update({ visibility: newVisibility })
                .eq('id', post.id);

            if (error) throw error;
            toast.success("Visibility updated successfully");
            if (onPostChange) onPostChange();
        } catch (error: any) {
            console.error("Visibility error:", error);
            toast.error("An unexpected error occurred while updating visibility.");
        } finally {
            setIsUpdatingVisibility(false);
        }
    };

    const handleReaction = async (reactionType: ReactionType) => {
        if (!profile?.id) {
            toast.error("You must be logged in to react.");
            return;
        }

        setIsReacting(true);
        try {
            if (myReactionType === reactionType) {
                // Toggle off — remove reaction
                const { error } = await supabase.rpc('remove_feed_reaction', {
                    p_post_id: post.id,
                    p_profile_id: profile.id,
                });
                if (error) throw error;
            } else {
                // Add / change reaction
                const { error } = await supabase.rpc('add_feed_reaction', {
                    p_post_id: post.id,
                    p_profile_id: profile.id,
                    p_reaction: reactionType,
                });
                if (error) throw error;
            }
            if (onPostChange) onPostChange();
        } catch (error: any) {
            console.error("Error toggling reaction:", error);
            toast.error("Failed to update reaction.");
        } finally {
            setIsReacting(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!editContent.trim()) return;
        setIsSavingEdit(true);
        try {
            const { error } = await supabase
                .from('feed_posts')
                .update({ content: editContent.trim() })
                .eq('id', post.id);

            if (error) throw error;
            toast.success("Post updated");
            setIsEditing(false);
            if (onPostChange) onPostChange();
        } catch (error: any) {
            console.error("Error editing post:", error);
            toast.error("Failed to update post.");
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        if (!profile?.id) {
            toast.error("You must be logged in to comment.");
            return;
        }

        setIsSubmittingComment(true);
        try {
            const { error } = await supabase.rpc('add_feed_comment', {
                p_post_id: post.id,
                p_profile_id: profile.id,
                p_comment: commentText.trim(),
            });

            if (error) throw error;
            setCommentText("");
            if (onPostChange) onPostChange();
        } catch (error: any) {
            console.error("Error adding comment:", error);
            toast.error("Failed to add comment.");
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!profile?.id) return;
        try {
            const { error } = await supabase.rpc('remove_feed_comment', {
                p_post_id: post.id,
                p_comment_id: commentId,
                p_profile_id: profile.id,
            });

            if (error) throw error;
            toast.success("Comment deleted");
            if (onPostChange) onPostChange();
        } catch (error) {
            console.error("Error deleting comment:", error);
            toast.error("Failed to delete comment.");
        }
    };

    const handleShare = () => {
        const shareUrl = `${window.location.origin}/post/${post.id}`;
        if (navigator.share) {
            navigator.share({
                title: 'Check out this post on VanshMala',
                text: post.content,
                url: shareUrl,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(shareUrl);
            toast.success("Post link copied to clipboard!");
        }
    }

    // Build reaction summary chips
    const reactionSummary = REACTIONS.filter(r => (reactionCounts[r.type] || 0) > 0);

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
                        {post.visibility && (
                            <span className="flex items-center gap-1 text-muted-foreground ml-1">
                                {post.visibility === 'public' && <Globe className="h-3 w-3" />}
                                {post.visibility === '3rd_degree' && <Users className="h-3 w-3" />}
                                {post.visibility === '2nd_degree' && <Users className="h-3 w-3" />}
                                {post.visibility === '1st_degree' && <Lock className="h-3 w-3" />}
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        {isEdited && <span className="ml-1 italic">(edited)</span>}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {post.post_type === 'announcement' && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-saffron/10 text-saffron-700 rounded-full text-xs font-medium border border-saffron/30 shadow-sm self-start mt-1">
                            <Pin className="h-3 w-3" />
                            <span>Announcement</span>
                        </div>
                    )}
                    {post.post_type === 'invite' && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200 shadow-sm self-start mt-1">
                            <Calendar className="h-3 w-3" />
                            <span>Invite</span>
                        </div>
                    )}

                    {isOwner && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                    onSelect={() => {
                                        setEditContent(post.content);
                                        setIsEditing(true);
                                    }}
                                >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit Post
                                </DropdownMenuItem>
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        <Eye className="mr-2 h-4 w-4" />
                                        <span>Edit Visibility</span>
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuPortal>
                                        <DropdownMenuSubContent>
                                            <DropdownMenuRadioGroup value={post.visibility || '1st_degree'} onValueChange={handleVisibilityChange}>
                                                <DropdownMenuRadioItem value="1st_degree" disabled={isUpdatingVisibility}>
                                                    <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
                                                    Immediate Family
                                                </DropdownMenuRadioItem>
                                                <DropdownMenuRadioItem value="2nd_degree" disabled={isUpdatingVisibility}>
                                                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                                                    Family Tree
                                                </DropdownMenuRadioItem>
                                                <DropdownMenuRadioItem value="3rd_degree" disabled={isUpdatingVisibility}>
                                                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                                                    Extended Family
                                                </DropdownMenuRadioItem>
                                                <DropdownMenuRadioItem value="public" disabled={isUpdatingVisibility}>
                                                    <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                                                    Public
                                                </DropdownMenuRadioItem>
                                            </DropdownMenuRadioGroup>
                                        </DropdownMenuSubContent>
                                    </DropdownMenuPortal>
                                </DropdownMenuSub>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onSelect={(e) => {
                                        e.preventDefault();
                                        setShowDeleteDialog(true);
                                    }}
                                    className="text-red-500 focus:text-red-500 cursor-pointer"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Post
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {post.post_type === 'invite' && (post as any).sub_type ? (
                    <InviteCard
                        subType={(post as any).sub_type}
                        content={isEditing ? undefined : post.content}
                        authorName={post.profiles?.full_name || undefined}
                        eventDate={(post as any).event_date || null}
                        eventTime={(post as any).event_time || null}
                        postId={post.id}
                        rsvps={post.rsvps || []}
                        profileId={profile?.id || null}
                        onPostChange={onPostChange}
                    />
                ) : post.post_type === 'announcement' && (post as any).sub_type ? (
                    <AnnouncementCard
                        subType={(post as any).sub_type}
                        content={post.content}
                        authorName={post.profiles?.full_name || undefined}
                    />
                ) : isEditing ? (
                    <div className="px-4 pb-3 space-y-2">
                        <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[80px] text-sm"
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditing(false)}
                                disabled={isSavingEdit}
                            >
                                <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSaveEdit}
                                disabled={isSavingEdit || !editContent.trim()}
                            >
                                {isSavingEdit ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                                Save
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="px-4 pb-3">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>
                    </div>
                )}
                <RewardBadges rewards={post.rewards} />
            </CardContent>

            <CardFooter className="flex flex-col p-0">
                {/* Reaction summary */}
                {reactionSummary.length > 0 && (
                    <div className="w-full flex items-center gap-1.5 px-4 pt-1.5 pb-0.5 text-xs text-muted-foreground">
                        {reactionSummary.map(r => (
                            <span key={r.type} className="inline-flex items-center gap-0.5">
                                <span>{r.emoji}</span>
                                <span className="font-medium">{reactionCounts[r.type]}</span>
                            </span>
                        ))}
                    </div>
                )}

                {/* Actions row */}
                <div className="w-full flex items-center justify-between px-2 py-1 border-t border-border/50">
                    <div className="flex gap-0.5">
                        {/* Emoji reaction buttons */}
                        {REACTIONS.map(r => (
                            <Button
                                key={r.type}
                                variant="ghost"
                                size="sm"
                                className={`px-2 rounded-full text-base transition-transform hover:scale-110 ${myReactionType === r.type ? 'bg-primary/10 ring-1 ring-primary/30 scale-105' : 'opacity-70 hover:opacity-100'}`}
                                onClick={() => handleReaction(r.type)}
                                disabled={isReacting}
                                title={r.label}
                            >
                                {r.emoji}
                            </Button>
                        ))}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 px-3 rounded-full text-muted-foreground hover:bg-blue-50 hover:text-blue-500"
                            onClick={() => setShowComments(!showComments)}
                        >
                            <MessageCircle className="h-5 w-5" />
                            {commentsCount > 0 && <span className="text-sm font-medium">{commentsCount}</span>}
                        </Button>
                        <AnshdaanButton post={post} onPostChange={onPostChange} />
                    </div>
                    {post.visibility === 'public' && (
                        <Button variant="ghost" size="sm" className="px-3 rounded-full text-muted-foreground hover:bg-gray-100" onClick={handleShare}>
                            <Share2 className="h-5 w-5" />
                        </Button>
                    )}
                </div>

                {/* Comments Section */}
                {showComments && (
                    <div className="w-full bg-muted/20 border-t border-border/50 px-4 py-3 animate-in slide-in-from-top-2 duration-200">
                        {/* Add Comment */}
                        {profile?.id ? (
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
                        ) : (
                            <div className="flex items-center justify-between mb-4 p-2 pl-4 bg-background/50 rounded-full border border-border/50">
                                <span className="text-xs text-muted-foreground italic">Sign in to join the conversation</span>
                                <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-saffron hover:text-saffron-700 hover:bg-saffron/5 rounded-full">
                                    <Link to="/login">Sign In</Link>
                                </Button>
                            </div>
                        )}

                        {/* Existing Comments */}
                        {post.comments && post.comments.length > 0 ? (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {post.comments.map(comment => (
                                    <div key={comment.id} className="flex gap-2.5">
                                        <Avatar className="h-7 w-7 shrink-0 border border-border/50 mt-1">
                                            <AvatarImage src={comment.profiles?.avatar_url || ''} />
                                            <AvatarFallback className="bg-primary/5 text-[10px]">
                                                {comment.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col bg-background/60 hover:bg-background/80 transition-colors border border-border/40 rounded-2xl rounded-tl-sm px-3 pt-2 pb-2.5 shadow-sm text-sm break-words flex-1 group">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <span className="font-semibold text-xs text-foreground/80">
                                                    {comment.profiles?.full_name || 'Unknown'}
                                                </span>
                                                {comment.profile_id === profile?.id && (
                                                    <button
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Delete comment"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </div>
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

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="w-[90vw] max-w-[400px] rounded-xl sm:rounded-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove this post from the feed. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col gap-2 sm:flex-row mt-2">
                        <AlertDialogCancel disabled={isDeleting} className="mt-0">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            disabled={isDeleting}
                            className="bg-red-500 text-white hover:bg-red-600 focus:ring-red-500"
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
};
