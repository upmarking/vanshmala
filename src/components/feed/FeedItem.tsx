
import { FeedPost } from "@/types/feed";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Calendar, Megaphone } from "lucide-react";

interface FeedItemProps {
    post: FeedPost;
}

export const FeedItem = ({ post }: FeedItemProps) => {
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
                return "border-blue-200 bg-blue-50/30";
            case 'announcement':
                return "border-red-200 bg-red-50/30";
            default:
                return "border-border";
        }
    };

    return (
        <Card className={`mb-4 transition-all hover:shadow-md ${getBorderColor()}`}>
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Avatar>
                    <AvatarImage src={post.profiles?.avatar_url || ''} />
                    <AvatarFallback>{post.profiles?.full_name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="font-semibold text-sm">{post.profiles?.full_name || 'Unknown User'}</span>
                    <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                </div>
                <div className="ml-auto">
                    <Badge variant={getBadgeVariant()} className="flex items-center capitalize">
                        {getIcon()}
                        {post.post_type}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm whitespace-pre-wrap">{post.content}</p>
            </CardContent>
        </Card>
    );
};
