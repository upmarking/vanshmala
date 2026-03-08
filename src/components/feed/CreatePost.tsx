
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedPostType, VisibilityType, InviteSubType, AnnouncementSubType } from "@/types/feed";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

interface CreatePostProps {
    onPostCreated: () => void;
}

export const CreatePost = ({ onPostCreated }: CreatePostProps) => {
    const { user, profile } = useAuth();
    const [content, setContent] = useState("");
    const [postType, setPostType] = useState<FeedPostType>("post");
    const [subType, setSubType] = useState<string>("");
    const [visibility, setVisibility] = useState<VisibilityType>("1st_degree");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim()) return;
        if (!user) return;

        // profile.id is the PK in the `profiles` table, which is what
        // feed_posts.user_id references via its foreign key constraint.
        if (!profile?.id) {
            toast.error("Your profile is still loading. Please try again in a moment.");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('feed_posts')
                .insert({
                    user_id: profile.id,   // FK → profiles.id  (NOT auth user.id)
                    content: content.trim(),
                    post_type: postType,
                    visibility: visibility
                });

            if (error) throw error;

            toast.success("Post created successfully!");
            setContent("");
            setPostType("post");
            setVisibility("1st_degree");
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
                    <div className="flex gap-2">
                        <Select value={postType} onValueChange={(v) => setPostType(v as FeedPostType)}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="post">Post</SelectItem>
                                <SelectItem value="invite">Invite</SelectItem>
                                <SelectItem value="announcement">Announcement</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={visibility} onValueChange={(v) => setVisibility(v as VisibilityType)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Who can see this?" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1st_degree">Immediate Family (Safest)</SelectItem>
                                <SelectItem value="2nd_degree">Family Tree</SelectItem>
                                <SelectItem value="3rd_degree">Extended Family</SelectItem>
                                <SelectItem value="public">Public</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
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
        </Card >
    );
};
