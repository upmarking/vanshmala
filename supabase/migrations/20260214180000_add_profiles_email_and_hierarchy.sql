-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS father_id uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS mother_id uuid REFERENCES public.profiles(id);

-- Create index for email search
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Update handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url, email)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.email
  );
  
  -- Also add default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

-- Backfill email from auth.users (This might require superuser privileges, depending on Supabase setup)
-- If this fails, user might need to run it manually or we skip it.
-- Standard RLS often blocks access to auth schema. 
-- However, migrations usually run with admin privileges.
DO $$
BEGIN
    UPDATE public.profiles p
    SET email = u.email
    FROM auth.users u
    WHERE p.user_id = u.id
    AND p.email IS NULL;
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors during backfill if auth schema is not accessible
    NULL;
END $$;
