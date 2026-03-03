import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Loader2, Trash2, Globe, Users, Lock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
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

interface FeedPostProps {
    event: any;
    member: any;
    onPostChange?: () => void;
}

export const FeedPost = ({ event, member, onPostChange }: FeedPostProps) => {
    const { user, profile } = useAuth();
    const [isLiking, setIsLiking] = useState(false);
    const [isCommenting, setIsCommenting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [showComments, setShowComments] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const commentInputRef = useRef<HTMLInputElement>(null);

    const getInitials = (name: string) => {
        return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
    };

    const formattedDate = event.created_at
        ? formatDistanceToNow(new Date(event.created_at), { addSuffix: true })
        : 'Just now';

    // Extract likes and comments safely
    const likes = Array.isArray(event.timeline_likes) ? event.timeline_likes : [];
    const comments = Array.isArray(event.timeline_comments) ? event.timeline_comments : [];

    const hasLiked = profile ? likes.some((like: any) => like.profile_id === profile.id) : false;

    const handleLike = useCallback(async () => {
        if (!profile) {
            toast.error("You must be logged in to like an event");
            return;
        }

        if (isLiking) return;
        setIsLiking(true);

        try {
            if (hasLiked) {
                const { error } = await supabase
                    .from('timeline_likes')
                    .delete()
                    .eq('event_id', event.id)
                    .eq('profile_id', profile.id);

                if (error) {
                    toast.error("Could not unlike: " + error.message);
                } else {
                    onPostChange?.();
                }
            } else {
                const { error } = await supabase
                    .from('timeline_likes')
                    .insert({
                        event_id: event.id,
                        profile_id: profile.id
                    });

                if (error) {
                    toast.error("Could not like: " + error.message);
                } else {
                    onPostChange?.();
                }
            }
        } catch (error: any) {
            console.error("Like error:", error);
            toast.error("Failed to process your like");
        } finally {
            setIsLiking(false);
        }
    }, [event.id, profile, hasLiked, isLiking, onPostChange]);

    const handleComment = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!profile) {
            toast.error("You must be logged in to comment");
            return;
        }

        const text = commentText.trim();
        if (!text) return;

        setIsCommenting(true);
        try {
            const { error } = await supabase
                .from('timeline_comments')
                .insert({
                    event_id: event.id,
                    profile_id: profile.id,
                    comment: text
                });

            if (error) {
                toast.error("Failed to post comment: " + error.message);
            } else {
                setCommentText("");
                setShowComments(true);
                onPostChange?.();
            }
        } catch (error: any) {
            console.error("Comment error:", error);
            toast.error("Failed to process your comment");
        } finally {
            setIsCommenting(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            const { error } = await supabase
                .from('timeline_comments')
                .delete()
                .eq('id', commentId);

            if (error) {
                toast.error("Failed to delete comment: " + error.message);
            } else {
                toast.success("Comment deleted");
                onPostChange?.();
            }
        } catch (error: any) {
            console.error("Delete comment error:", error);
            toast.error("An unexpected error occurred while deleting comment");
        }
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `Event on VanshMala: ${event.title}`,
                    text: event.description || "Check out this family update on VanshMala!",
                    url: window.location.href,
                });
            } else {
                await navigator.clipboard.writeText(`${event.title} - ${window.location.href}`);
                toast.success('Link copied to clipboard!');
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const toggleComments = () => {
        setShowComments(!showComments);
        if (!showComments) {
            setTimeout(() => {
                commentInputRef.current?.focus();
            }, 100);
        }
    };

    const isOwner = user?.id === event.created_by;

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('timeline_events')
                .delete()
                .eq('id', event.id);

            if (error) {
                toast.error("Failed to delete event: " + error.message);
            } else {
                toast.success("Event deleted successfully");
                onPostChange?.();
            }
        } catch (error: any) {
            console.error("Delete error:", error);
            toast.error("An unexpected error occurred while deleting.");
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    const handleVisibilityChange = async (newVisibility: string) => {
        setIsUpdatingVisibility(true);
        try {
            const { error } = await supabase
                .from('timeline_events')
                .update({ visibility: newVisibility })
                .eq('id', event.id);

            if (error) {
                toast.error("Failed to update visibility: " + error.message);
            } else {
                toast.success("Visibility updated successfully");
                onPostChange?.();
            }
        } catch (error: any) {
            console.error("Visibility error:", error);
            toast.error("An unexpected error occurred while updating visibility.");
        } finally {
            setIsUpdatingVisibility(false);
        }
    };

    return (
        <Card className="mb-6 overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4 p-4 pb-2">
                <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={member?.avatar_url || ''} alt={member?.full_name} />
                    <AvatarFallback className="bg-gradient-saffron text-primary-foreground text-xs">
                        {getInitials(member?.full_name)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h3 className="text-sm font-semibold">{member?.full_name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{formattedDate}</span>
                        {event.visibility && (
                            <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    {event.visibility === 'public' && <Globe className="h-3 w-3" />}
                                    {event.visibility === '3rd_degree' && <Users className="h-3 w-3" />}
                                    {event.visibility === '2nd_degree' && <Users className="h-3 w-3" />}
                                    {event.visibility === '1st_degree' && <Lock className="h-3 w-3" />}
                                </span>
                            </>
                        )}
                    </div>
                </div>
                {isOwner && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    <Eye className="mr-2 h-4 w-4" />
                                    <span>Edit Visibility</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuRadioGroup value={event.visibility || '1st_degree'} onValueChange={handleVisibilityChange}>
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
                                <span>Delete Post</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </CardHeader>

            <CardContent className="p-0">
                {event.media_urls && event.media_urls.length > 0 && (
                    <div className="relative aspect-video bg-muted mb-4 overflow-hidden">
                        {/* Simplified image handling for MVP - showing first image */}
                        <img
                            src={event.media_urls[0].url || event.media_urls[0]}
                            alt={event.title}
                            className="object-cover w-full h-full"
                        />
                    </div>
                )}

                <div className="px-4 pb-4">
                    <h4 className="font-semibold text-lg mb-1">{event.title}</h4>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-2">
                        {event.description}
                    </p>

                    <div className="flex items-center gap-2 mt-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground capitalize">
                            {event.event_type}
                        </span>
                        {event.date && (
                            <span className="text-xs text-muted-foreground">
                                Event Date: {new Date(event.date).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
            </CardContent>

            <div className="px-4 py-2 flex items-center gap-1 text-sm text-muted-foreground font-medium">
                {likes.length > 0 && (
                    <div className="flex items-center gap-1.5 cursor-pointer">
                        <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                        <span className="hover:underline">{likes.length} {likes.length === 1 ? 'like' : 'likes'}</span>
                    </div>
                )}

                {likes.length > 0 && comments.length > 0 && <span className="mx-1.5">•</span>}

                {comments.length > 0 && (
                    <div className="cursor-pointer hover:underline" onClick={toggleComments}>
                        {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                    </div>
                )}
            </div>

            <CardFooter className="p-2 border-t flex flex-col items-stretch gap-3">
                <div className="flex justify-between w-full px-2">
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`gap-1.5 ${hasLiked ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : 'text-muted-foreground hover:bg-muted'}`}
                            onClick={handleLike}
                            disabled={isLiking}
                        >
                            <Heart className={`h-5 w-5 ${hasLiked ? 'fill-current' : ''}`} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-muted-foreground hover:bg-muted"
                            onClick={toggleComments}
                        >
                            <MessageCircle className="h-5 w-5" />
                        </Button>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-muted-foreground hover:bg-muted"
                        onClick={handleShare}
                    >
                        <Share2 className="h-5 w-5" />
                    </Button>
                </div>

                <AnimatePresence>
                    {showComments && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden w-full px-2 mt-1"
                        >
                            <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {comments.map((comment: any) => (
                                    <div key={comment.id} className="flex gap-2.5">
                                        <Avatar className="h-7 w-7 border shrink-0">
                                            <AvatarImage src={comment.profiles?.avatar_url || ''} />
                                            <AvatarFallback className="text-[10px] bg-muted">
                                                {getInitials(comment.profiles?.full_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 bg-muted/60 p-2.5 rounded-2xl rounded-tl-none group">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <span className="font-semibold text-xs text-foreground">
                                                    {comment.profiles?.full_name || 'User'}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {comment.profile_id === profile?.id && (
                                                        <button
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="Delete comment"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-foreground/90 break-words">
                                                {comment.comment}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex gap-2 items-center w-full px-2 pb-2">
                    <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-muted text-xs">
                            {getInitials(profile?.full_name || '')}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 relative flex items-center">
                        <Input
                            ref={commentInputRef}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Add a comment..."
                            className="w-full bg-muted/50 border-transparent hover:bg-muted focus-visible:ring-1 focus-visible:ring-saffron/50 focus-visible:bg-background pr-10 rounded-full h-9"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleComment();
                                }
                            }}
                            disabled={isCommenting}
                        />
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute right-0 h-9 w-9 text-saffron hover:bg-transparent hover:text-saffron-600 disabled:opacity-50"
                            onClick={handleComment}
                            disabled={isCommenting || !commentText.trim()}
                        >
                            {isCommenting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </CardFooter>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="w-[90vw] max-w-[400px] rounded-xl sm:rounded-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove this event from your timeline. This action cannot be undone.
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
