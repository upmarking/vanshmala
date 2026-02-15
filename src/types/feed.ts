
import { Database } from "@/integrations/supabase/types";

export type FeedPostRow = Database['public']['Tables']['feed_posts']['Row'];
export type FeedPostInsert = Database['public']['Tables']['feed_posts']['Insert'];
export type FeedPostUpdate = Database['public']['Tables']['feed_posts']['Update'];

export type FeedPostType = FeedPostRow['post_type'];

export interface FeedPost extends FeedPostRow {
    profiles?: {
        full_name: string | null;
        avatar_url: string | null;
    } | null;
}
