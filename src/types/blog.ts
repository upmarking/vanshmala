
export interface Blog {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    author_id: string | null;
    featured_image_url: string | null;
    meta_title: string | null;
    meta_description: string | null;
    is_published: boolean;
    published_at: string | null;
    created_at: string;
    updated_at: string;
}
