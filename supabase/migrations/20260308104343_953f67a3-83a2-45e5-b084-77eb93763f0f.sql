
-- Add public share token to family_trees
ALTER TABLE public.family_trees ADD COLUMN IF NOT EXISTS public_share_token TEXT UNIQUE DEFAULT NULL;

-- Create tree_link_requests table
CREATE TABLE public.tree_link_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID NOT NULL REFERENCES public.family_trees(id) ON DELETE CASCADE,
  requester_user_id UUID NOT NULL,
  target_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  ai_suggested_parent_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  ai_suggested_relationship TEXT,
  ai_confidence NUMERIC,
  ai_reasoning TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  full_name TEXT NOT NULL,
  relationship_claim TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID
);

ALTER TABLE public.tree_link_requests ENABLE ROW LEVEL SECURITY;

-- RLS: Requester can view own requests
CREATE POLICY "Users can view own link requests" ON public.tree_link_requests
  FOR SELECT USING (auth.uid() = requester_user_id);

-- RLS: Tree admins can view all requests for their tree
CREATE POLICY "Tree admins can view link requests" ON public.tree_link_requests
  FOR SELECT USING (is_tree_admin(auth.uid(), tree_id));

-- RLS: Authenticated users can create requests
CREATE POLICY "Authenticated users can create link requests" ON public.tree_link_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_user_id);

-- RLS: Tree admins can update requests
CREATE POLICY "Tree admins can update link requests" ON public.tree_link_requests
  FOR UPDATE USING (is_tree_admin(auth.uid(), tree_id));

-- Function to generate/get share token
CREATE OR REPLACE FUNCTION public.get_or_create_share_token(p_tree_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Check caller is tree admin
  IF NOT is_tree_admin(auth.uid(), p_tree_id) THEN
    RAISE EXCEPTION 'Only tree admins can generate share links';
  END IF;

  SELECT public_share_token INTO v_token FROM family_trees WHERE id = p_tree_id;

  IF v_token IS NULL THEN
    v_token := encode(gen_random_bytes(16), 'hex');
    UPDATE family_trees SET public_share_token = v_token WHERE id = p_tree_id;
  END IF;

  RETURN v_token;
END;
$$;

-- Public read access for shared trees (no auth required)
CREATE POLICY "Public can view shared trees" ON public.family_trees
  FOR SELECT USING (public_share_token IS NOT NULL);

-- Public read for members of shared trees
CREATE POLICY "Public can view members of shared trees" ON public.family_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_trees ft
      WHERE ft.id = family_members.tree_id
      AND ft.public_share_token IS NOT NULL
    )
  );

-- Public read for relationships of shared trees
CREATE POLICY "Public can view relationships of shared trees" ON public.family_relationships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_trees ft
      WHERE ft.id = family_relationships.tree_id
      AND ft.public_share_token IS NOT NULL
    )
  );
