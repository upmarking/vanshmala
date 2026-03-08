-- Create blogs table for SEO-friendly content
CREATE TABLE IF NOT EXISTS public.blogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid(),
    featured_image_url TEXT,
    meta_title TEXT,
    meta_description TEXT,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published blogs
CREATE POLICY "Allow public read access to published blogs" 
ON public.blogs FOR SELECT 
USING (is_published = true);

-- Allow authenticated users to read their own (unpublished) blogs
CREATE POLICY "Allow authors to read their own blogs" 
ON public.blogs FOR SELECT 
TO authenticated 
USING (auth.uid() = author_id);

-- Allow authenticated users to create blogs
CREATE POLICY "Allow authenticated users to create blogs" 
ON public.blogs FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = author_id);

-- Allow authors to update their own blogs
CREATE POLICY "Allow authors to update their own blogs" 
ON public.blogs FOR UPDATE 
TO authenticated 
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- Allow authors to delete their own blogs
CREATE POLICY "Allow authors to delete their own blogs" 
ON public.blogs FOR DELETE 
TO authenticated 
USING (auth.uid() = author_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating updated_at
CREATE TRIGGER set_blogs_updated_at
    BEFORE UPDATE ON public.blogs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
