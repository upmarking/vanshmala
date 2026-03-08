
import { Database } from "@/integrations/supabase/types";

export type FeedPostRow = Database['public']['Tables']['feed_posts']['Row'];
export type FeedPostInsert = Database['public']['Tables']['feed_posts']['Insert'];
export type FeedPostUpdate = Database['public']['Tables']['feed_posts']['Update'];

export type FeedPostType = 'post' | 'invite' | 'announcement';

export type VisibilityType = '1st_degree' | '2nd_degree' | '3rd_degree' | 'public';

export type InviteSubType = 'casual' | 'festival' | 'birthday' | 'marriage';
export type AnnouncementSubType = 'achievement' | 'celebration' | 'donation';

/** Shape of each element in the JSONB `likes` array on feed_posts */
export interface FeedLike {
    profile_id: string;
    created_at: string;
}

/** Shape of each element in the JSONB `comments` array on feed_posts */
export interface FeedComment {
    id: string;
    profile_id: string;
    comment: string;
    created_at: string;
    /** Enriched client-side after fetching profile data (optional) */
    profiles?: {
        full_name: string | null;
        avatar_url: string | null;
    };
}

/** Reward contribution counts per type */
export interface RewardCounts {
    leaf: number;
    rose: number;
    diamond: number;
    star: number;
}

/** Full feed post as used by the UI, with JSONB arrays parsed to typed arrays */
export interface FeedPost extends Omit<FeedPostRow, 'likes' | 'comments'> {
    sub_type?: string | null;
    profiles?: {
        full_name: string | null;
        avatar_url: string | null;
    } | null;
    likes: FeedLike[];
    comments: FeedComment[];
    rewards?: RewardCounts;
}
