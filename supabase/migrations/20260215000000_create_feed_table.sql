-- Create feed_posts table
CREATE TABLE IF NOT EXISTS public.feed_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    post_type TEXT NOT NULL CHECK (post_type IN ('post', 'invite', 'announcement')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Everyone can view posts (authenticated users)
CREATE POLICY "Everyone can view posts" ON public.feed_posts
    FOR SELECT TO authenticated
    USING (true);

-- Users can create their own posts
CREATE POLICY "Users can create their own posts" ON public.feed_posts
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update their own posts" ON public.feed_posts
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete their own posts" ON public.feed_posts
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_posts;
