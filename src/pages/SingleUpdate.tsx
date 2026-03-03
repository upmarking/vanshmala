
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FeedPost } from "@/components/dashboard/FeedPost";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const SingleUpdate = () => {
    const { id } = useParams<{ id: string }>();
    const [event, setEvent] = useState<any>(null);
    const [member, setMember] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEvent = async () => {
        if (!id) return;

        try {
            setIsLoading(true);
            const { data: eventData, error: eventError } = await supabase
                .from('timeline_events')
                .select(`
                    *,
                    timeline_likes (
                        event_id,
                        profile_id,
                        created_at
                    ),
                    timeline_comments (
                        id,
                        event_id,
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

            if (eventError) throw eventError;

            if (eventData) {
                // Fetch member details
                const { data: memberData } = await supabase
                    .from('family_members')
                    .select('id, full_name, avatar_url, tree_id')
                    .eq('id', eventData.family_member_id)
                    .single();

                setEvent(eventData);
                setMember(memberData);
            }
        } catch (err: any) {
            console.error("Error fetching single update:", err);
            setError(err.message || "Failed to load update");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvent();
    }, [id]);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 container max-w-2xl mx-auto pt-24 pb-12 px-4">
                <div className="mb-6">
                    <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground hover:text-foreground">
                        <Link to="/dashboard">
                            <ArrowLeft size={16} />
                            Back to Dashboard
                        </Link>
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : error || !event ? (
                    <div className="text-center py-12 bg-card rounded-xl border border-dashed">
                        <h2 className="text-xl font-semibold mb-2">Update not found</h2>
                        <p className="text-muted-foreground mb-6">This family update might have been deleted or is no longer public.</p>
                        <Button asChild>
                            <Link to="/dashboard">Go to Dashboard</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <FeedPost event={event} member={member} onPostChange={fetchEvent} />
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default SingleUpdate;
