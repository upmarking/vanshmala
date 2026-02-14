-- Create Tags Table
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID REFERENCES public.family_trees(id) ON DELETE CASCADE, -- Nullable for system tags
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Custom', -- e.g., 'Community', 'Profession', 'Custom'
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_tag_per_tree UNIQUE (tree_id, name) -- Prevent duplicates within a tree
);

-- Enable RLS for tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Tags Policies
CREATE POLICY "Tags visible to tree members" ON public.tags
  FOR SELECT TO authenticated USING (
    tree_id IS NULL OR -- System tags
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.tree_id = tags.tree_id
      AND public.is_tree_member(auth.uid(), fm.tree_id)
    )
  );

CREATE POLICY "Tree admins and creator can create tags" ON public.tags
  FOR INSERT TO authenticated WITH CHECK (
    tree_id IS NOT NULL AND (
      auth.uid() = created_by OR
      EXISTS (
        SELECT 1 FROM public.tree_memberships tm
        WHERE tm.tree_id = tags.tree_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'admin' OR tm.role = 'owner' OR public.is_tree_admin(auth.uid(), tags.tree_id))
      )
    )
  );
-- Note: 'is_tree_admin' function usage might need adjustment based on valid arguments, assuming (user_uid, tree_uuid).

CREATE POLICY "Tree admins and creator can update tags" ON public.tags
  FOR UPDATE TO authenticated USING (
    tree_id IS NOT NULL AND (
      auth.uid() = created_by OR
      public.is_tree_admin(auth.uid(), tree_id)
    )
  );

CREATE POLICY "Tree admins and creator can delete tags" ON public.tags
  FOR DELETE TO authenticated USING (
    tree_id IS NOT NULL AND (
      auth.uid() = created_by OR
      public.is_tree_admin(auth.uid(), tree_id)
    )
  );


-- Create Profile Tags Junction Table
CREATE TABLE public.profile_tags (
  profile_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, tag_id)
);

-- Enable RLS for profile_tags
ALTER TABLE public.profile_tags ENABLE ROW LEVEL SECURITY;

-- Profile Tags Policies
CREATE POLICY "Profile tags visible to tree members" ON public.profile_tags
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.id = profile_tags.profile_id
      AND public.is_tree_member(auth.uid(), fm.tree_id)
    )
  );

CREATE POLICY "Tree members can assign tags" ON public.profile_tags
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.id = profile_tags.profile_id
      AND public.is_tree_member(auth.uid(), fm.tree_id)
    )
  );

CREATE POLICY "Tree members can remove tags" ON public.profile_tags
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.id = profile_tags.profile_id
      AND public.is_tree_member(auth.uid(), fm.tree_id)
    )
  );


-- Create Documents Table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID REFERENCES public.family_trees(id) ON DELETE CASCADE NOT NULL,
  uploader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- e.g., 'Birth Certificate', 'Property', 'General'
  file_path TEXT NOT NULL, -- Storage path
  file_type TEXT,
  file_size BIGINT,
  generation_level INTEGER, -- Optional, to filter by generation
  access_level TEXT DEFAULT 'tree_members' CHECK (access_level IN ('admin_only', 'tree_members', 'public')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Documents Policies
CREATE POLICY "Documents visible to tree members" ON public.documents
  FOR SELECT TO authenticated USING (
    public.is_tree_member(auth.uid(), tree_id) AND (
      access_level = 'public' OR
      access_level = 'tree_members' OR
      (access_level = 'admin_only' AND public.is_tree_admin(auth.uid(), tree_id))
    )
  );

CREATE POLICY "Tree members can upload documents" ON public.documents
  FOR INSERT TO authenticated WITH CHECK (
    public.is_tree_member(auth.uid(), tree_id)
  );

CREATE POLICY "Uploader and admins can delete documents" ON public.documents
  FOR DELETE TO authenticated USING (
    auth.uid() = uploader_id OR
    public.is_tree_admin(auth.uid(), tree_id)
  );

-- Create Storage Bucket for Documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'documents' bucket
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'documents' AND auth.role() = 'authenticated'
  );

-- Allow viewing documents based on access level (simplified for storage, relying on table RLS for metadata info, but storage needs its own)
-- Since storage policies are hard to link to table data efficiently, we typically allow read if user is part of the tree.
-- For stricter control, we might need signed URLs. For now, allow read if authenticated.
CREATE POLICY "Authenticated users can read documents"
  ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id = 'documents'
  );

-- Allow deletion by owner
CREATE POLICY "Users can delete own documents"
  ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'documents' AND owner = auth.uid()
  );
