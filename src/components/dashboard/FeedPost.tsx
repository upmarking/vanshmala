import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedPostProps {
    event: any;
    member: any;
}

export const FeedPost = ({ event, member }: FeedPostProps) => {
    const getInitials = (name: string) => {
        return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
    };

    const formattedDate = event.created_at
        ? formatDistanceToNow(new Date(event.created_at), { addSuffix: true })
        : 'Just now';

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
                    <p className="text-xs text-muted-foreground">{formattedDate}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </Button>
            </CardHeader>

            <CardContent className="p-0">
                {event.media_urls && event.media_urls.length > 0 && (
                    <div className="relative aspect-video bg-muted mb-4 overflow-hidden">
                        {/* Simplified image handling for MVP - showing first image */}
                        <img
                            src={event.media_urls[0].url}
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

            <CardFooter className="p-3 border-t bg-muted/20 flex justify-between">
                <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-red-500">
                        <Heart className="h-4 w-4" />
                        <span className="text-xs">Like</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-blue-500">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-xs">Comment</span>
                    </Button>
                </div>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                    <Share2 className="h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
};
