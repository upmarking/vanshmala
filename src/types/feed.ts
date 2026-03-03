
import { Database } from "@/integrations/supabase/types";

export type FeedPostRow = Database['public']['Tables']['feed_posts']['Row'] & { visibility?: string };
export type FeedPostInsert = Database['public']['Tables']['feed_posts']['Insert'] & { visibility?: string };
export type FeedPostUpdate = Database['public']['Tables']['feed_posts']['Update'] & { visibility?: string };

export type FeedPostType = FeedPostRow['post_type'];

export type VisibilityType = '1st_degree' | '2nd_degree' | '3rd_degree' | 'public';

export interface FeedComment {
    id: string;
    post_id: string;
    profile_id: string;
    comment: string;
    created_at: string;
    profiles?: {
        full_name: string | null;
        avatar_url: string | null;
    };
}

export interface FeedLike {
    post_id: string;
    profile_id: string;
    created_at: string;
}

export interface FeedPost extends FeedPostRow {
    profiles?: {
        full_name: string | null;
        avatar_url: string | null;
    } | null;
    feed_likes?: FeedLike[];
    feed_comments?: FeedComment[];
}
