export type TimelineEvent = {
    id: string;
    family_member_id: string;
    title: string;
    date: string | null;
    event_type: 'birth' | 'education' | 'career' | 'marriage' | 'child' | 'death' | 'other';
    description: string | null;
    media_urls: { url: string; type: 'image' | 'document'; caption?: string }[];
    created_by: string | null;
    created_at: string;
};

export type LegacyMessage = {
    id: string;
    creator_id: string;
    recipient_id: string | null;
    target_family_member_id: string | null;
    title: string;
    content_type: 'audio' | 'video' | 'text';
    media_url: string | null;
    message_text: string | null;
    unlock_condition: 'date' | 'event' | 'after_death';
    unlock_date: string | null;
    is_unlocked: boolean;
    created_at: string;
};
