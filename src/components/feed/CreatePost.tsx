
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedPostType } from "@/types/feed";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

interface CreatePostProps {
    onPostCreated: () => void;
}

export const CreatePost = ({ onPostCreated }: CreatePostProps) => {
    const { user } = useAuth();
    const [content, setContent] = useState("");
    const [postType, setPostType] = useState<FeedPostType>("post");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim()) return;
        if (!user) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('feed_posts')
                .insert({
                    user_id: user.id,
                    content: content.trim(),
                    post_type: postType
                });

            if (error) throw error;

            toast.success("Post created successfully!");
            setContent("");
            setPostType("post");
            onPostCreated();
        } catch (error) {
            console.error("Error creating post:", error);
            toast.error("Failed to create post");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="mb-6">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">Share something</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea
                    placeholder="What's on your mind?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={3}
                    className="resize-none"
                />
                <div className="flex justify-between items-center">
                    <Select value={postType} onValueChange={(v) => setPostType(v as FeedPostType)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="post">Post</SelectItem>
                            <SelectItem value="invite">Invite</SelectItem>
                            <SelectItem value="announcement">Announcement</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleSubmit} disabled={!content.trim() || isSubmitting}>
                        {isSubmitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="mr-2 h-4 w-4" />
                        )}
                        Post
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
