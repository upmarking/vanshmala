
-- ============================================
-- VANSHMALA COMPLETE DATABASE SCHEMA
-- ============================================

-- 1. ENUM TYPES
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.relationship_type AS ENUM ('parent', 'child', 'spouse', 'sibling');
CREATE TYPE public.merge_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'other');

-- 2. PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  full_name_hi TEXT,
  vanshmala_id TEXT NOT NULL UNIQUE,
  gotra TEXT,
  gender gender_type,
  date_of_birth DATE,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. USER ROLES TABLE
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- 4. FAMILY TREES TABLE
CREATE TABLE public.family_trees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_name TEXT NOT NULL,
  family_name_hi TEXT,
  family_id TEXT NOT NULL UNIQUE DEFAULT 'FAM-' || substr(gen_random_uuid()::text, 1, 8),
  gotra TEXT,
  kuldevi TEXT,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. FAMILY MEMBERS TABLE (people in a tree, may or may not be registered users)
CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID REFERENCES public.family_trees(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vanshmala_id TEXT NOT NULL UNIQUE DEFAULT 'VM-' || substr(gen_random_uuid()::text, 1, 6),
  full_name TEXT NOT NULL,
  full_name_hi TEXT,
  gender gender_type,
  gotra TEXT,
  date_of_birth DATE,
  date_of_death DATE,
  is_alive BOOLEAN DEFAULT true,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  generation_level INT DEFAULT 1,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. FAMILY RELATIONSHIPS TABLE
CREATE TABLE public.family_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID REFERENCES public.family_trees(id) ON DELETE CASCADE NOT NULL,
  from_member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE NOT NULL,
  to_member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE NOT NULL,
  relationship relationship_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(from_member_id, to_member_id, relationship)
);

-- 7. TREE MEMBERS (which users belong to which trees)
CREATE TABLE public.tree_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID REFERENCES public.family_trees(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'editor', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tree_id, user_id)
);

-- 8. MERGE REQUESTS TABLE
CREATE TABLE public.merge_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID REFERENCES public.family_trees(id) ON DELETE CASCADE NOT NULL,
  source_member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE NOT NULL,
  target_member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE NOT NULL,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status merge_status DEFAULT 'pending',
  notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tree_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merge_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECURITY DEFINER FUNCTIONS
-- ============================================

-- Check if user has a role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if user is member of a tree
CREATE OR REPLACE FUNCTION public.is_tree_member(_user_id UUID, _tree_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tree_memberships
    WHERE user_id = _user_id AND tree_id = _tree_id
  )
$$;

-- Check if user is admin of a tree
CREATE OR REPLACE FUNCTION public.is_tree_admin(_user_id UUID, _tree_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tree_memberships
    WHERE user_id = _user_id AND tree_id = _tree_id AND role = 'admin'
  )
$$;

-- Generate next Vanshmala ID
CREATE OR REPLACE FUNCTION public.generate_vanshmala_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_id INT;
  result TEXT;
BEGIN
  SELECT COALESCE(MAX(
    CAST(NULLIF(regexp_replace(vanshmala_id, '[^0-9]', '', 'g'), '') AS INT)
  ), 0) + 1
  INTO next_id
  FROM public.profiles;
  result := 'VM-' || LPAD(next_id::TEXT, 4, '0');
  RETURN result;
END;
$$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- PROFILES
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Tree members can view each other's profiles
CREATE POLICY "Tree members can view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.tree_memberships tm1
      JOIN public.tree_memberships tm2 ON tm1.tree_id = tm2.tree_id
      WHERE tm1.user_id = auth.uid() AND tm2.user_id = profiles.user_id
    )
  );

-- USER ROLES
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- FAMILY TREES
CREATE POLICY "Tree members can view their trees" ON public.family_trees
  FOR SELECT TO authenticated USING (public.is_tree_member(auth.uid(), id));

CREATE POLICY "Authenticated users can create trees" ON public.family_trees
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Tree admins can update trees" ON public.family_trees
  FOR UPDATE TO authenticated USING (public.is_tree_admin(auth.uid(), id));

CREATE POLICY "Tree admins can delete trees" ON public.family_trees
  FOR DELETE TO authenticated USING (public.is_tree_admin(auth.uid(), id));

-- FAMILY MEMBERS
CREATE POLICY "Tree members can view family members" ON public.family_members
  FOR SELECT TO authenticated USING (public.is_tree_member(auth.uid(), tree_id));

CREATE POLICY "Tree members can add family members" ON public.family_members
  FOR INSERT TO authenticated WITH CHECK (public.is_tree_member(auth.uid(), tree_id));

CREATE POLICY "Tree admins can update family members" ON public.family_members
  FOR UPDATE TO authenticated USING (
    public.is_tree_member(auth.uid(), tree_id)
  );

CREATE POLICY "Tree admins can delete family members" ON public.family_members
  FOR DELETE TO authenticated USING (public.is_tree_admin(auth.uid(), tree_id));

-- FAMILY RELATIONSHIPS
CREATE POLICY "Tree members can view relationships" ON public.family_relationships
  FOR SELECT TO authenticated USING (public.is_tree_member(auth.uid(), tree_id));

CREATE POLICY "Tree members can add relationships" ON public.family_relationships
  FOR INSERT TO authenticated WITH CHECK (public.is_tree_member(auth.uid(), tree_id));

CREATE POLICY "Tree admins can delete relationships" ON public.family_relationships
  FOR DELETE TO authenticated USING (public.is_tree_admin(auth.uid(), tree_id));

-- TREE MEMBERSHIPS
CREATE POLICY "Members can view tree memberships" ON public.tree_memberships
  FOR SELECT TO authenticated USING (public.is_tree_member(auth.uid(), tree_id));

CREATE POLICY "Authenticated users can join trees" ON public.tree_memberships
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Tree admins can update memberships" ON public.tree_memberships
  FOR UPDATE TO authenticated USING (public.is_tree_admin(auth.uid(), tree_id));

CREATE POLICY "Users can leave trees" ON public.tree_memberships
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- MERGE REQUESTS
CREATE POLICY "Tree members can view merge requests" ON public.merge_requests
  FOR SELECT TO authenticated USING (public.is_tree_member(auth.uid(), tree_id));

CREATE POLICY "Tree members can create merge requests" ON public.merge_requests
  FOR INSERT TO authenticated WITH CHECK (public.is_tree_member(auth.uid(), tree_id));

CREATE POLICY "Tree admins can update merge requests" ON public.merge_requests
  FOR UPDATE TO authenticated USING (public.is_tree_admin(auth.uid(), tree_id));

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_trees_updated_at
  BEFORE UPDATE ON public.family_trees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_members_updated_at
  BEFORE UPDATE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, vanshmala_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    public.generate_vanshmala_id()
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-add tree creator as admin member
CREATE OR REPLACE FUNCTION public.handle_new_tree()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.tree_memberships (tree_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_family_tree_created
  AFTER INSERT ON public.family_trees
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_tree();
